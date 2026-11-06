import { useEffect, useState, type ReactNode } from 'react';
import battery from '../assets/device/battery.svg';
import batteryWhite from '../assets/device/battery-white.svg';
import dynamicIsland from '../assets/device/dynamic-island.svg';
import homeIndicator from '../assets/device/home-indicator.svg';
import homeIndicatorWhite from '../assets/device/home-indicator-white.svg';
import signal from '../assets/device/signal.svg';
import signalWhite from '../assets/device/signal-white.svg';
import wifi from '../assets/device/wifi.svg';
import wifiWhite from '../assets/device/wifi-white.svg';
import styles from './DeviceFrame.module.css';

const WIDTH = 393;
const HEIGHT = 852;

export type Tone = 'dark' | 'light';

interface DeviceFrameProps {
  /** 上のステータスバーの色。紺の画面（H-02・H-04・管理者画面）では 白 */
  statusTone?: Tone;
  /** 下のホームバーの色 */
  indicatorTone?: Tone;
  children: ReactNode;
}

/** パソコンで確認するとき：Figma と同じ 393×852 のスマホの枠に入れて見せる */
export function DeviceFrame({ statusTone = 'dark', indicatorTone = 'dark', children }: DeviceFrameProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => setScale(Math.min(1, (window.innerHeight - 48) / HEIGHT));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const light = statusTone === 'light';

  return (
    <div className={styles.slot} style={{ width: WIDTH * scale, height: HEIGHT * scale }}>
      <div className={styles.device} data-frame="phone" style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}>
        <div className={styles.screen}>{children}</div>
        <div className={`${styles.statusBar} ${light ? styles.light : ''}`} aria-hidden="true">
          <span className={styles.time}>9:41</span>
          <img className={styles.island} src={dynamicIsland} alt="" />
          <img className={styles.signal} src={light ? signalWhite : signal} alt="" />
          <img className={styles.wifi} src={light ? wifiWhite : wifi} alt="" />
          <img className={styles.battery} src={light ? batteryWhite : battery} alt="" />
        </div>
        <img
          className={styles.homeIndicator}
          src={indicatorTone === 'light' ? homeIndicatorWhite : homeIndicator}
          alt=""
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

const PC_WIDTH = 1440;
const PC_HEIGHT = 1024;

/**
 * 管理者画面 PC版を Figma と同じ 1440×1024 の画面で見せる（となりの確認パネルの分を あけて 縮める）。
 * せまい画面で 確認パネルが かくれているときは 左右の余白だけ あける
 */
export function PcFrame({ children, reserve }: { children: ReactNode; reserve: number }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const side = window.matchMedia('(max-width: 860px)').matches ? 32 : reserve;
      setScale(Math.min(1, (window.innerWidth - side) / PC_WIDTH, (window.innerHeight - 48) / PC_HEIGHT));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [reserve]);

  return (
    <div className={styles.slot} style={{ width: PC_WIDTH * scale, height: PC_HEIGHT * scale }}>
      <div className={styles.pc} data-frame="pc" style={{ width: PC_WIDTH, height: PC_HEIGHT, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
