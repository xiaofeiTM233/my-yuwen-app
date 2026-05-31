'use client';

import dynamic from 'next/dynamic';
import { ProTable } from '@ant-design/pro-components';

const ClientProTable = dynamic(() => Promise.resolve(ProTable), { ssr: false });

export default ClientProTable;
