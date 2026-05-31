'use client';

import dynamic from 'next/dynamic';
import { ProLayout } from '@ant-design/pro-components';
import { BookOutlined, HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  return (
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
  );
}

export default dynamic(() => Promise.resolve(ProLayoutContent), { ssr: false });
