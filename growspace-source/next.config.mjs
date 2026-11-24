/** @type {import('next').NextConfig} */
export default {
  output: 'standalone',
  outputFileTracingIncludes: { '/api/card/[handle]': ['./assets/*'] },
  async rewrites() {
    return [{ source: '/@:handle', destination: '/u/:handle' }];
  },
};
