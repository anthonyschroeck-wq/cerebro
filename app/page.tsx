"use client";
import dynamic from "next/dynamic";

const Cerebro = dynamic(() => import("./cerebro"), { ssr: false });

export default function Home() {
  return <Cerebro />;
}
