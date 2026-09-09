import Image from "next/image";

export default function Brand() {
  return (
    <div className="brand">
      <Image src="/brand/logo-white.png" alt="toprankers" width={36} height={41} className="brand-mark" />
      <div className="brand-name">
        toprankers.
        <b>SUPERGRADS</b>
      </div>
    </div>
  );
}
