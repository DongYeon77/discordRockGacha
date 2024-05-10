import { REST, Routes } from 'discord.js';

const CLIENT_ID = "1223673078719189093";
const TOKEN = "MTIyMzY3MzA3ODcxOTE4OTA5Mw.G4gU2z.r_ys07QKxUbegRhJisCqK0Hrd5aPvzYBlzPpTs";

const commands = [
  {
    name: '뽑기권구매',
    description: '강화석 10개로 뽑기권을 얻습니다.',
  },
  {
    name: '가입하기',
    description: '봇에 가입합니다.',
  },
  // {
  //   name: '인벤토리',
  //   description: '내 인벤토리를 확인합니다.',
  // },
  {
    name: '채굴하기',
    description: '강화석을 채굴합니다.',
  },
  {
    name: '뽑기',
    description: '뽑기권을 소모해서 돌을 뽑습니다.',
  },
  {
    name: '교환하기',
    description: '돌을 소모해서 교환합니다.',
    options: [
      {
        name: '돌선택',
        description:'교환할 돌을 선택합니다.',
        type: 3,
        required: true,
        choices: [
          {
            name: 'F급 돌',
            value: 'F급 돌',
          },
          {
            name: 'E급 돌',
            value: 'E급 돌',
          },
          {
            name: 'D급 돌',
            value: 'D급 돌',
          },
          {
            name: 'C급 돌',
            value: 'C급 돌',
          },
          {
            name: 'B급 돌',
            value: 'B급 돌',
          },
          {
            name: 'A급 돌',
            value: 'A급 돌',
          },
          {
            name: 'S급 돌',
            value: 'S급 돌',
          },
          {
            name: 'SS급 돌',
            value: 'SS급 돌',
          },
          {
            name: 'SSS급 돌',
            value: 'SSS급 돌',
          }
        ]
      },
      {
        name: '갯수',
        description: '교환할 갯수를 입력하세요.',
        type: 4,
        require: true,
      }
    ]
  },
  {
    name: '인벤토리',
    description: '자신의 인벤토리를 확인합니다.',
  },
  {
    name: '뽑기권10개구매',
    description: '뽑기권 10개를 구매하고 강화석 100개를 소모합니다.',
  },
  {
    name: '10연뽑기',
    description: '10번 연속으로 돌을 뽑습니다.',
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}

