import { reactive } from 'vue';
import { chatNotificationService } from './chat_service';
import { sendWebRTCSignaling } from '@/api/chat';

/**
 * 【消息结构】
 */
export type SignalingType = 
  | 'call_invite' | 'call_accept' | 'call_reject' | 'hangup'
  | 'offer' | 'answer' | 'ice_candidate';

/**
 * 后端严格要求的发送结构
 */
export interface SignalingMessage {
  callId: string;
  from: string;
  to: string;
  type: SignalingType;
  data: string; // 严格要求为字符串
}

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'in_call';

/**
 * 【架构设计】适配器接口
 */
export interface WebRTCAdapter {
  init(config: RTCConfiguration): void;
  createOffer(): Promise<RTCSessionDescriptionInit>;
  createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  setLocalDescription(desc: RTCSessionDescriptionInit): Promise<void>;
  setRemoteDescription(desc: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
  getLocalStream(video?: boolean, audio?: boolean): Promise<MediaStream>;
  close(): void;
  
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (stream: MediaStream) => void;
}

/**
 * 【架构设计】Web 端适配器实现
 */
export class WebWebRTCAdapter implements WebRTCAdapter {
  private pc: RTCPeerConnection | null = null;
  public onIceCandidate?: (candidate: RTCIceCandidate) => void;
  public onTrack?: (stream: MediaStream) => void;

  init(config: RTCConfiguration) {
    console.log('[WebRTC] 初始化 RTCPeerConnection');
    this.pc = new RTCPeerConnection(config);
    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.onIceCandidate?.(e.candidate);
    };
    this.pc.ontrack = (e) => {
      console.log('[WebRTC] 收到远程轨道');
      if (e.streams && e.streams[0]) {
        this.onTrack?.(e.streams[0]);
      }
    };
  }

  async getLocalStream(video = true, audio = true): Promise<MediaStream> {
    try {
      console.log('[WebRTC] 请求媒体权限:', { video, audio });
      return await navigator.mediaDevices.getUserMedia({ video, audio });
    } catch (e) {
      console.warn('[WebRTC] 媒体请求失败，尝试降级...', e);
      if (video && audio) {
        try { return await navigator.mediaDevices.getUserMedia({ video: false, audio: true }); }
        catch (e2) {
          try { return await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
          catch (e3) { return new MediaStream(); }
        }
      }
      return new MediaStream();
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PC not initialized');
    return await this.pc.createOffer();
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PC not initialized');
    await this.pc.setRemoteDescription(offer);
    return await this.pc.createAnswer();
  }

  async setLocalDescription(desc: RTCSessionDescriptionInit): Promise<void> {
    await this.pc?.setLocalDescription(desc);
  }

  async setRemoteDescription(desc: RTCSessionDescriptionInit): Promise<void> {
    await this.pc?.setRemoteDescription(desc);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.pc?.addIceCandidate(candidate);
  }

  close() {
    console.log('[WebRTC] 关闭连接');
    this.pc?.getSenders().forEach(sender => {
      sender.track?.stop();
    });
    this.pc?.close();
    this.pc = null;
  }

  addTrack(stream: MediaStream) {
    stream.getTracks().forEach(track => {
      this.pc?.addTrack(track, stream);
    });
  }
}

/**
 * 【架构设计】SignalingClient
 */
export class SignalingClient {
  constructor(private onMessage: (msg: SignalingMessage) => void) {
    console.log('[WebRTC] SignalingClient 已启动并监听 WEBRTC_CALL');
    chatNotificationService.on('WEBRTC_CALL', (payload) => {
      console.log('[WebRTC] SignalingClient 收到原始推送 payload:', payload);
      this.onMessage(payload);
    });
  }

  async send(msg: SignalingMessage): Promise<void> {
    console.log('[WebRTC] 发送信令:', msg.type, msg);
    await sendWebRTCSignaling(msg);
  }
}

/**
 * 【架构设计】CallController (核心业务控制)
 */
export class CallController {
  public state = reactive({
    status: 'idle' as CallStatus,
    currentCallId: '',
    remoteUserId: '',
    localStream: null as MediaStream | null,
    remoteStream: null as MediaStream | null,
    isAudioOnly: false,
    videoEnabled: true,
    audioEnabled: true,
  });

  private adapter: WebRTCAdapter;
  private signaling: SignalingClient;
  private iceCandidateQueue: RTCIceCandidateInit[] = [];
  private rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  constructor(adapter: WebRTCAdapter) {
    this.adapter = adapter;
    this.signaling = new SignalingClient((msg) => this.handleSignaling(msg));
    
    this.adapter.onIceCandidate = (candidate) => {
      this.sendSignaling('ice_candidate', candidate);
    };
    
    this.adapter.onTrack = (stream) => {
      this.state.remoteStream = stream;
    };
  }

  async callUser(userId: string, audioOnly = false) {
    if (this.state.status !== 'idle') return;

    console.log('[WebRTC] 主动发起通话 ->', userId);
    this.state.status = 'calling';
    this.state.remoteUserId = userId;
    this.state.currentCallId = Date.now().toString();
    this.state.isAudioOnly = audioOnly;
    this.state.videoEnabled = !audioOnly;
    this.state.audioEnabled = true;

    try {
      this.state.localStream = await this.adapter.getLocalStream(!audioOnly, true);
      await this.sendSignaling('call_invite', { audioOnly });
    } catch (e) {
      console.error('[WebRTC] 发起呼叫失败:', e);
      this.reset();
    }
  }

  async acceptCall() {
    if (this.state.status !== 'ringing') return;

    console.log('[WebRTC] 接听通话');
    try {
      this.state.localStream = await this.adapter.getLocalStream(!this.state.isAudioOnly, true);
      this.adapter.init(this.rtcConfig);
      (this.adapter as WebWebRTCAdapter).addTrack(this.state.localStream);
      
      this.state.status = 'in_call';
      await this.sendSignaling('call_accept', {});
    } catch (e) {
      console.error('[WebRTC] 接听呼叫失败:', e);
      this.hangup();
    }
  }

  toggleLocalVideo() {
    if (!this.state.localStream) return;
    this.state.videoEnabled = !this.state.videoEnabled;
    this.state.localStream.getVideoTracks().forEach(track => {
      track.enabled = this.state.videoEnabled;
    });
  }

  toggleLocalAudio() {
    if (!this.state.localStream) return;
    this.state.audioEnabled = !this.state.audioEnabled;
    this.state.localStream.getAudioTracks().forEach(track => {
      track.enabled = this.state.audioEnabled;
    });
  }

  rejectCall() {
    console.log('[WebRTC] 拒绝通话');
    this.sendSignaling('call_reject', {});
    this.reset();
  }

  hangup() {
    console.log('[WebRTC] 挂断通话');
    this.sendSignaling('hangup', {});
    this.reset();
  }

  private reset() {
    this.adapter.close();
    this.state.status = 'idle';
    this.state.currentCallId = '';
    this.state.remoteUserId = '';
    this.state.localStream = null;
    this.state.remoteStream = null;
    this.iceCandidateQueue = [];
    this.state.videoEnabled = true;
    this.state.audioEnabled = true;
  }

  private async sendSignaling(type: SignalingType, data: any) {
    if (!this.state.currentCallId && type !== 'call_invite') return;
    
    const userinfo = uni.getStorageSync('userinfo');
    const fromId = userinfo?.id || 'anonymous';

    const message: SignalingMessage = {
      callId: this.state.currentCallId,
      from: String(fromId),
      to: String(this.state.remoteUserId),
      type: type,
      data: typeof data === 'string' ? data : JSON.stringify(data)
    };

    await this.signaling.send(message);
  }

  private async handleSignaling(msg: SignalingMessage) {
    console.log('[WebRTC] CallController 处理信令:', msg.type, '当前状态:', this.state.status);

    if (this.state.status !== 'idle' && msg.callId !== this.state.currentCallId) {
      console.warn('[WebRTC] 忽略信令: 忙线或 callId 冲突', { msgCallId: msg.callId, current: this.state.currentCallId });
      return;
    }

    let parsedData: any = null;
    try {
      parsedData = typeof msg.data === 'string' && (msg.data.startsWith('{') || msg.data.startsWith('[')) 
        ? JSON.parse(msg.data) 
        : msg.data;
    } catch (e) {
      parsedData = msg.data;
    }

    switch (msg.type) {
      case 'call_invite':
        console.log('[WebRTC] 收到呼叫邀请，进入 ringing 状态');
        this.state.status = 'ringing';
        this.state.remoteUserId = msg.from;
        this.state.currentCallId = msg.callId;
        this.state.isAudioOnly = !!parsedData?.audioOnly;
        break;

      case 'call_accept':
        console.log('[WebRTC] 对方已接听，开始建立连接');
        this.state.status = 'in_call';
        this.adapter.init(this.rtcConfig);
        if (this.state.localStream) {
          (this.adapter as WebWebRTCAdapter).addTrack(this.state.localStream);
        }
        const offer = await this.adapter.createOffer();
        await this.adapter.setLocalDescription(offer);
        await this.sendSignaling('offer', offer);
        break;

      case 'offer':
        console.log('[WebRTC] 收到 Offer，准备 Answer');
        const answer = await this.adapter.createAnswer(parsedData);
        await this.adapter.setLocalDescription(answer);
        await this.sendSignaling('answer', answer);
        this.processIceQueue();
        break;

      case 'answer':
        console.log('[WebRTC] 收到 Answer');
        await this.adapter.setRemoteDescription(parsedData);
        this.processIceQueue();
        break;

      case 'ice_candidate':
        console.log('[WebRTC] 收到 ICE Candidate');
        this.iceCandidateQueue.push(parsedData);
        this.processIceQueue();
        break;

      case 'call_reject':
      case 'hangup':
        console.log('[WebRTC] 对方已挂断/拒绝');
        this.reset();
        break;
    }
  }

  private async processIceQueue() {
    if (this.state.status !== 'in_call') return;
    
    const candidates = [...this.iceCandidateQueue];
    this.iceCandidateQueue = [];
    
    for (const cand of candidates) {
      try {
        await this.adapter.addIceCandidate(cand);
      } catch (e) {
        this.iceCandidateQueue.push(cand);
      }
    }
  }
}

const adapter = new WebWebRTCAdapter();
export const callController = new CallController(adapter);
