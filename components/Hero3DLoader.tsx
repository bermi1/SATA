"use client";

import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => <div className="absolute inset-0" />,
});

export default function Hero3DLoader({ color }: { color?: string }) {
  return <Hero3D color={color} />;
}
