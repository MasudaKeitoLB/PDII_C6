import { useEffect, useState, type ReactNode } from 'react';
import battery from '../assets/device/battery.svg';
import dynamicIsland from '../assets/device/dynamic-island.svg';
import homeIndicator from '../assets/device/home-indicator.svg';
import signal from '../assets/device/signal.svg';
import wifi from '../assets/device/wifi.svg';
import styles from './DeviceFrame.module.css';

const WIDTH = 393;
const HEIGHT = 852;

/** パソコンで確認するとき：Figma と同じ 393×852 のスマホの枠に入れて見せる */
export function DeviceFrame({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => setScale(Math.min(1, (window.innerHeight - 48) / HEIGHT));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className={styles.slot} style={{ width: WIDTH * scale, height: HEIGHT * scale }}>
      <div className={styles.device} style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}>
        <div className={styles.screen}>{children}</div>
        <div className={styles.statusBar} aria-hidden="true">
          <span className={styles.time}>9:41</span>
          <img className={styles.island} src={dynamicIsland} alt="" />
          <img className={styles.signal} src={signal} alt="" />
          <img className={styles.wifi} src={wifi} alt="" />
          <img className={styles.battery} src={battery} alt="" />
        </div>
        <img className={styles.homeIndicator} src={homeIndicator} alt="" aria-hidden="true" />
      </div>
    </div>
  );
}
