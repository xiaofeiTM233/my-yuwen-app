import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import zhCN from "antd/locale/zh_CN";
import LayoutContent from "./components/LayoutContent";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "文言文翻译 - 新高考应考助手",
  description: "逐句对照文言文翻译，助力新高考语文备考",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AntdRegistry>
          <ConfigProvider locale={zhCN}>
            <App>
              <LayoutContent>{children}</LayoutContent>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
