/**
 * Chromecast Manager
 */

declare global {
  interface Window {
    chrome: any;
    cast: any;
    __onGCastApiAvailable: (isAvailable: boolean) => void;
  }
}

export class CastManager {
  private static instance: CastManager;
  private session: any = null;
  private mediaElement: HTMLVideoElement | null = null;
  private onStateChange: ((state: CastState) => void) | null = null;

  private constructor() {}

  static getInstance(): CastManager {
    if (!CastManager.instance) {
      CastManager.instance = new CastManager();
    }
    return CastManager.instance;
  }

  init(onStateChange: (state: CastState) => void) {
    this.onStateChange = onStateChange;
    
    if (typeof window === 'undefined') return;

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable) {
        this.initializeCastApi();
      }
    };
  }

  private initializeCastApi() {
    if (!window.cast) return;

    const cast = window.cast;
    const sessionRequest = new cast.SessionRequest(
      cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
    );
    const apiConfig = new cast.ApiConfig(
      sessionRequest,
      this.sessionListener.bind(this),
      this.receiverListener.bind(this)
    );

    cast.initialize(apiConfig, () => {
      console.log('Cast initialized');
    }, (error: any) => {
      console.error('Cast init error:', error);
    });
  }

  private sessionListener(session: any) {
    this.session = session;
    this.notifyStateChange({
      isCasting: true,
      deviceName: session.receiver.friendlyName,
      canControl: true,
    });
  }

  private receiverListener(availability: string) {
    console.log('Receiver availability:', availability);
  }

  async startCast(videoUrl: string, title: string, poster?: string) {
    if (!window.chrome?.cast?.isAvailable) {
      throw new Error('Cast API not available');
    }

    return new Promise((resolve, reject) => {
      const cast = window.cast;
      cast.requestSession(
        (session: any) => {
          this.session = session;
          this.loadMedia(videoUrl, title, poster);
          resolve(session);
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  private loadMedia(url: string, title: string, poster?: string) {
    if (!this.session) return;

    const mediaInfo = new window.cast.media.MediaInfo(url, 'application/x-mpegurl');
    mediaInfo.metadata = new window.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.title = title;
    if (poster) {
      mediaInfo.metadata.images = [new window.cast.Image(poster)];
    }

    const request = new window.cast.media.LoadRequest(mediaInfo);
    
    this.session.loadMedia(
      request,
      (media: any) => {
        console.log('Media loaded on cast device');
        this.notifyStateChange({
          isCasting: true,
          deviceName: this.session.receiver.friendlyName,
          canControl: true,
        });
      },
      (error: any) => {
        console.error('Error loading media:', error);
      }
    );
  }

  async stopCast() {
    if (this.session) {
      await this.session.stop();
      this.session = null;
      this.notifyStateChange({
        isCasting: false,
        deviceName: null,
        canControl: false,
      });
    }
  }

  play() {
    if (this.session?.media?.[0]) {
      this.session.media[0].play();
    }
  }

  pause() {
    if (this.session?.media?.[0]) {
      this.session.media[0].pause();
    }
  }

  setVolume(level: number) {
    if (this.session) {
      const volume = new window.cast.Volume(level);
      const request = new window.cast.VolumeRequest(volume);
      this.session.setReceiverVolumeLevel(request);
    }
  }

  seek(time: number) {
    if (this.session?.media?.[0]) {
      const request = new window.cast.media.SeekRequest();
      request.currentTime = time;
      this.session.media[0].seek(request);
    }
  }

  getState(): CastState {
    return {
      isCasting: !!this.session,
      deviceName: this.session?.receiver?.friendlyName || null,
      canControl: !!this.session,
    };
  }

  private notifyStateChange(state: CastState) {
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }
}

export interface CastState {
  isCasting: boolean;
  deviceName: string | null;
  canControl: boolean;
}

// AirPlay Helper
export class AirPlayManager {
  private videoElement: HTMLVideoElement | null = null;
  private onStateChange: ((isAirPlaying: boolean) => void) | null = null;

  init(videoElement: HTMLVideoElement, onStateChange: (isAirPlaying: boolean) => void) {
    this.videoElement = videoElement;
    this.onStateChange = onStateChange;

    // Enable AirPlay
    videoElement.setAttribute('x-webkit-airplay', 'allow');
    (videoElement as any).disableRemotePlayback = false;

    // Listen for AirPlay status changes
    if ('webkitCurrentPlaybackTargetIsWireless' in videoElement) {
      const checkAirPlay = () => {
        const isAirPlaying = (videoElement as any).webkitCurrentPlaybackTargetIsWireless;
        this.onStateChange?.(isAirPlaying);
      };

      videoElement.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', checkAirPlay);
      videoElement.addEventListener('webkitplaybacktargetavailabilitychanged', checkAirPlay);
    }
  }

  isAvailable(): boolean {
    if (!this.videoElement) return false;
    return 'webkitShowPlaybackTargetPicker' in this.videoElement;
  }

  showPicker() {
    if (this.videoElement && 'webkitShowPlaybackTargetPicker' in this.videoElement) {
      (this.videoElement as any).webkitShowPlaybackTargetPicker();
    }
  }

  isAirPlaying(): boolean {
    if (!this.videoElement) return false;
    return (this.videoElement as any).webkitCurrentPlaybackTargetIsWireless || false;
  }
}

