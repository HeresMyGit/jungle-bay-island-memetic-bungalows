// Token configuration with contract addresses
// CoinGecko platform IDs: ethereum, base, solana

export const WATCHED_TOKENS = {
  primary: [
    {
      id: 'pepe',
      symbol: 'PEPE',
      name: 'Pepe',
      color: '#3D9C40',
      platform: 'ethereum',
      contract: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
      enabled: false
    },
    {
      id: 'bobo-eth',
      symbol: 'BOBO',
      name: 'Bobo (ETH)',
      color: '#8B4513',
      platform: 'ethereum',
      contract: '0xb90b2a35c65dbc466b04240097ca756ad2005295',
      enabled: false
    },
    {
      id: 'bobo-base',
      symbol: 'BOBO',
      name: 'Bobo (Base)',
      color: '#A0522D',
      platform: 'base',
      contract: '0x570b1533f6daa82814b25b62b5c7c4c55eb83947',
      enabled: false
    },
    {
      id: 'brainlet',
      symbol: 'BRAINLET',
      name: 'Brainlet',
      color: '#FF69B4',
      platform: 'solana',
      contract: '8NNXWrWVctNw1UFeaBypffimTdcLCcD8XJzHvYsmgwpF',
      enabled: false
    },
    {
      id: 'drb',
      symbol: 'DRB',
      name: 'DRB',
      color: '#4169E1',
      platform: 'base',
      contract: '0x3ec2156d4c0a9cbdab4a016633b7bcf6a8d68ea2',
      enabled: true
    },
    {
      id: 'towelie-eth',
      symbol: 'TOWELIE',
      name: 'Towelie (ETH)',
      color: '#00CED1',
      platform: 'ethereum',
      contract: '0x420698cfdeddea6bc78d59bc17798113ad278f9d',
      enabled: false
    },
    {
      id: 'towelie-base',
      symbol: 'TOWELIE',
      name: 'Towelie (Base)',
      color: '#20B2AA',
      platform: 'base',
      contract: '0x279e7cff2dbc93ff1f5cae6cbd072f98d75987ca',
      enabled: false
    },
    {
      id: 'rizz-sol',
      symbol: 'RIZZ',
      name: 'Rizz',
      color: '#FF4500',
      platform: 'solana',
      contract: '5ad4puH6yDBoeCcrQfwV5s9bxvPnAeWDoYDj3uLyBS8k',
      enabled: false
    },
    {
      id: 'soyjak',
      symbol: 'SOY',
      name: 'Soy',
      color: '#FFD700',
      platform: 'solana',
      contract: '4G3kNxwaA2UQHDpaQtJWQm1SReXcUD7LkT14v2oEs7rV',
      enabled: false
    },
    {
      id: 'bankr',
      symbol: 'BANKR',
      name: 'Bankr',
      color: '#228B22',
      platform: 'base',
      contract: '0x22af33fe49fd1fa80c7149773dde5890d3c76f3b',
      enabled: true
    },
    {
      id: 'qr',
      symbol: 'QR',
      name: 'QR Coin',
      color: '#9932CC',
      platform: 'base',
      contract: '0x2b5050f01d64fbb3e4ac44dc07f0732bfb5ecadf',
      enabled: false
    },
    {
      id: 'jbm',
      symbol: 'JBM',
      name: 'Jungle Bay Memes',
      color: '#32CD32',
      platform: 'base',
      contract: '0x3313338fe4bb2a166b81483bfcb2d4a6a1ebba8d',
      enabled: true
    },
    {
      id: 'net',
      symbol: 'ALPHA',
      name: 'Alpha',
      color: '#9400D3',
      platform: 'base',
      contract: '0x3D01Fe5A38ddBD307fDd635b4Cb0e29681226D6f',
      enabled: false
    },
    {
      id: 'mfer-base',
      symbol: 'MFER',
      name: '$mfer',
      color: '#000000',
      platform: 'base',
      contract: '0xE3086852A4B125803C815a158249ae468A3254Ca',
      enabled: false
    }
  ],
  secondary: [
    {
      id: 'smurfcat',
      symbol: 'SMURFCAT',
      name: 'Smurfcat',
      color: '#1E90FF',
      platform: 'ethereum',
      contract: '0xff836a5821e69066c87e268bc51b849fab94240c',
      enabled: false
    },
    {
      id: 'snibbu',
      symbol: 'SNIBBU',
      name: 'Snibbu',
      color: '#FF8C00',
      platform: 'ethereum',
      contract: '0xaee9ba9ce49fe810417a36408e34d9962b653e78',
      enabled: false
    },
    {
      id: 'mumu',
      symbol: 'MUMU',
      name: 'Mumu the Bull',
      color: '#8B0000',
      platform: 'solana',
      contract: '5LafQUrVco6o7KMz42eqVEJ9LW31StPyGjeeu5sKoMtA',
      enabled: false
    }
  ],
  tertiary: [
    {
      id: 'bigbrain',
      symbol: 'BIGBRAIN',
      name: 'Big Brain',
      color: '#FF1493',
      platform: 'solana',
      contract: 'J9zjM2nn4DBYpFy3qrReaUzY66g4EFMwLa61YSGCpump',
      enabled: false
    },
    {
      id: 'warwojak',
      symbol: 'SOULJAK',
      name: 'Souljak',
      color: '#B22222',
      platform: 'solana',
      contract: 'AbNzAEiA7zbNngcUFL92b7vEAUtJscSPwAiWV38Apump',
      enabled: false
    },
    {
      id: 'aix',
      symbol: 'AIX',
      name: 'AIImpact',
      color: '#00FFFF',
      platform: 'base',
      contract: '0x3f34d75da1027d20d052970c83bd4ddf8991557d',
      enabled: false
    },
    {
      id: 'iktfb',
      symbol: 'IKTFB',
      name: 'IKTFB',
      color: '#DA70D6',
      platform: 'solana',
      contract: 'CPKPoYC8eEXhsRRVQJPsvgwB6nUB4a987YkciNpMmsJP',
      enabled: false
    },
    {
      id: 'abyss',
      symbol: 'ABYSS',
      name: 'Abyss',
      color: '#191970',
      platform: 'base',
      contract: '0x20ad9d807644fc6d89f680851253a1ddc174dc1c',
      enabled: false
    },
    {
      id: 'apu',
      symbol: 'APU',
      name: 'Apu',
      color: '#98FB98',
      platform: 'ethereum',
      contract: '0x594daad7d77592a2b97b725a7ad59d7e188b5bfa',
      enabled: false
    }
  ]
};

// Get all tokens as a flat array
export function getAllTokens() {
  return [
    ...WATCHED_TOKENS.primary,
    ...WATCHED_TOKENS.secondary,
    ...WATCHED_TOKENS.tertiary
  ];
}

// Get tokens by tier
export function getTokensByTier(tier) {
  return WATCHED_TOKENS[tier] || [];
}
