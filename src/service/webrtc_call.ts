import { reactive } from 'vue';
import { notificationWebsocketService } from './notification_websocket_service';
import { getIceConfigApi, sendWebRTCSignaling } from '@/api/chat';

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
      // 检查媒体设备是否可用
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('当前浏览器不支持 getUserMedia');
      }
      return await navigator.mediaDevices.getUserMedia({ video, audio });
    } catch (e: any) {
      console.warn(`[WebRTC] 媒体请求失败 (${e.name}):`, e.message);

      // 针对常见错误的降级策略
      if (video && audio) {
        console.log('[WebRTC] 尝试降级：仅请求音频');
        try {
          return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (e2) {
          console.warn('[WebRTC] 降级请求音频也失败');
        }
      }

      // 实在拿不到就返回空流，避免上层崩溃
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

  addTransceiver(kind: 'audio' | 'video', direction: RTCRtpTransceiverDirection = 'sendrecv') {
    console.log(`[WebRTC] 添加收发器: ${kind}, 方向: ${direction}`);
    this.pc?.addTransceiver(kind, { direction });
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
    notificationWebsocketService.on('WEBRTC_CALL', (payload) => {
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
  private iceConfigLoadPromise: Promise<void> | null = null;
  private rtcConfig: RTCConfiguration = {
    iceServers: [{
      urls: [
        'stun:stun.l.google.com:19302',
        'turn:turn.echovoid.top:3478'
      ],
      username: 'echo',
      credential: 'hellomixin6879'
    }]
  };

  constructor(adapter: WebRTCAdapter) {
    this.adapter = adapter;
    this.signaling = new SignalingClient((msg) => this.handleSignaling(msg));

    this.iceConfigLoadPromise = this.loadRtcConfig();

    this.adapter.onIceCandidate = (candidate) => {
      this.sendSignaling('ice_candidate', candidate);
    };

    this.adapter.onIceCandidate = (candidate) => {
      this.sendSignaling('ice_candidate', candidate);
    };

    this.adapter.onTrack = (stream) => {
      this.state.remoteStream = stream;
    };
  }

  private async loadRtcConfig(): Promise<void> {
    try {
      const res = await getIceConfigApi();
      if (res.errcode === 0 && res.data && Array.isArray(res.data.urls) && res.data.urls.length > 0) {
        this.rtcConfig = {
          iceServers: [{
            urls: res.data.urls,
            username: res.data.username,
            credential: res.data.credential,
          }]
        };
        console.log('[WebRTC] ICE 配置已加载', this.rtcConfig);
        return;
      }
      console.warn('[WebRTC] ICE 配置接口返回异常，使用默认配置', res);
    } catch (error) {
      console.warn('[WebRTC] 获取 ICE 配置失败，使用默认配置', error);
    }
  }

  private async ensureRtcConfig(): Promise<void> {
    if (!this.iceConfigLoadPromise) {
      this.iceConfigLoadPromise = this.loadRtcConfig();
    }
    await this.iceConfigLoadPromise;
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
      this.syncCapabilities();
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
      this.syncCapabilities();
      await this.ensureRtcConfig();
      this.adapter.init(this.rtcConfig);

      // 核心修复：确保即使没有本地视频，也要协商视频通道
      if (!this.state.isAudioOnly) {
        const hasVideo = this.state.localStream?.getVideoTracks().length > 0;
        if (!hasVideo) {
          (this.adapter as WebWebRTCAdapter).addTransceiver('video', 'recvonly');
        } else {
          (this.adapter as WebWebRTCAdapter).addTrack(this.state.localStream);
        }
        // 同时也添加音频
        if (this.state.localStream?.getAudioTracks().length > 0) {
          // 如果已经通过 addTrack 添加了视频，则这里只添加音频
          // 但为了简单，如果没视频则 addTransceiver + addTrack(audio)
          // 如果有视频则直接 addTrack(stream) 已经包含全轨道
          if (!hasVideo) (this.adapter as WebWebRTCAdapter).addTrack(this.state.localStream);
        }
      } else {
        (this.adapter as WebWebRTCAdapter).addTrack(this.state.localStream);
      }

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

  private syncCapabilities() {
    if (!this.state.localStream) return;
    const hasVideo = this.state.localStream.getVideoTracks().length > 0;
    const hasAudio = this.state.localStream.getAudioTracks().length > 0;

    // 如果请求了视频但实际没拿到（由于硬件缺失或拒绝），更新状态
    if (!this.state.isAudioOnly && !hasVideo) {
      console.warn('[WebRTC] 未检测到摄像头，自动切换到无摄像头状态');
      this.state.videoEnabled = false;
    }

    // 检查麦克风
    if (!hasAudio) {
      console.warn('[WebRTC] 未检测到麦克风');
      this.state.audioEnabled = false;
    }
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
        await this.ensureRtcConfig();
        this.adapter.init(this.rtcConfig);

        // 核心修复：确保即使没有本地视频，也要协商视频通道
        if (!this.state.isAudioOnly) {
          const hasVideo = this.state.localStream?.getVideoTracks().length > 0;
          if (!hasVideo) {
            (this.adapter as WebWebRTCAdapter).addTransceiver('video', 'recvonly');
          } else {
            (this.adapter as WebWebRTCAdapter).addTrack(this.state.localStream);
          }
          if (!hasVideo && this.state.localStream) {
            (this.adapter as WebWebRTCAdapter).addTrack(this.state.localStream);
          }
        } else if (this.state.localStream) {
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
