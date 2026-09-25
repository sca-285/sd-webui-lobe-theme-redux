import { ConfigProvider } from '@lobehub/ui';

import { cdnUrl } from './assets';
import Index from './index';
import Layout from './layout';

const CDN_CONFIG = { customCdnFn: cdnUrl, proxy: 'custom' as const };

export default () => {
  return (
    <ConfigProvider config={CDN_CONFIG}>
      <Layout>
        <Index />
      </Layout>
    </ConfigProvider>
  );
};
