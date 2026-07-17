import { Sacramento } from "next/font/google";
import styles from "./Signature.module.css";

const sacramento = Sacramento({
  subsets: ["latin"],
  weight: "400",
});

export function Signature() {
  return (
    <div className={styles.signature}>
      <span className={`${sacramento.className} ${styles.text}`}>
        by nandini
      </span>

      <svg
        className={styles.flourish}
        viewBox="0 0 120 44"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="
            M4 25
            C16 23.5 28 23 44 21
            C49 18 52 14 54 10
            C57 5 64 6 66 12
            C68 6 75 5 79 10
            C85 18 77 25 66 32
            C56 25 48 18 54 10
            M79 20
            C90 22 101 21 116 17
          "
          pathLength="1"
        />
      </svg>
    </div>
  );
}
