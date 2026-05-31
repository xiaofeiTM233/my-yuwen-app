'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ProLayout } from '@ant-design/pro-components';
import { BookOutlined, HomeOutlined, RobotOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AiSidebar from './AiSidebar';

const menuRoutes = {
  route: {
    path: '/',
    routes: [
      { path: '/', name: '文言文列表', icon: <HomeOutlined /> },
      { path: '/xuci', name: '虚词手册', icon: <BookOutlined /> },
    ],
  },
};

function ProLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [aiVisible, setAiVisible] = useState(false);

  return (
    <>
      <ProLayout
        title="文言文翻译"
        logo={null}
        {...menuRoutes}
        location={{ pathname }}
        menuItemRender={(item, dom) => <Link href={item.path || '/'}>{dom}</Link>}
        fixSiderbar
        layout="mix"
      >
        {children}
      </ProLayout>
      <AiSidebar
        visible={aiVisible}
        onToggle={() => setAiVisible(!aiVisible)}
        onDataUpdate={() => window.location.reload()}
      />
    </>
  );
}

export default dynamic(() => Promise.resolve(ProLayoutContent), { ssr: false });
