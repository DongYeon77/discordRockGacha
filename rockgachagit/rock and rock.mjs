import { Client, GatewayIntentBits, EmbedBuilder, inlineCode } from 'discord.js';
import sqlite3 from 'sqlite3';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = "MTIyMzY3MzA3ODcxOTE4OTA5Mw.G4gU2z.r_ys07QKxUbegRhJisCqK0Hrd5aPvzYBlzPpTs";
const db = new sqlite3.Database('rock.db', (err) => {
  if (err) {
    console.error('Unable to open database file:', err);
  } else {
    console.log('Connected to the database');
  }
});


// 돌 채굴 함수
function mineStones(userId) {
  const maxStones = 5; // 최대 얻을 수 있는 돌의 개수
  const stonesObtained = Math.floor(Math.random() * (maxStones + 1)); // 0부터 최대 개수까지의 랜덤한 개수를 얻습니다.

    // 사용자의 돌 정보를 업데이트합니다.
    db.run(`UPDATE user_stones SET "강화석" = "강화석" + ? WHERE user_id = ?`, [stonesObtained, userId], function (err) {
      if (err) {
        return console.error(err.message);
      }

      if (stonesObtained === 0) {
        console.log(`와! 맹구의 짱돌을 얻으셨군요!`);
      } else {
        console.log(`사용자 ${userId}가 ${stonesObtained}개의 강화석을 채굴하여 얻었습니다.`);
      }
    });

    return stonesObtained;

}


// 뽑기권 구매 함수
function purchaseGachaTicket(userId) {
  const cost = 10; // 뽑기권 구매에 필요한 강화석의 양

  // 사용자의 강화석 개수 조회
  db.get('SELECT 강화석 FROM user_stones WHERE user_id = ?', [userId], function (err, row) {
    if (err) {
      return console.error(err.message);
    }

    // 강화석이 충분한지 확인
    if (!row || row['강화석'] < cost) {
      console.log(`강화석이 부족하여 뽑기권을 구매할 수 없습니다.`);
      return;
    }

    // 강화석이 충분한 경우 강화석 차감 및 뽑기권 추가
    db.run(`UPDATE user_stones SET 강화석 = 강화석 - ?, 뽑기권 = 뽑기권 + 1 WHERE user_id = ?`, [cost, userId], function (err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`뽑기권 1개를 구매하였습니다.`);
    });
  });
}





// 돌 뽑기 함수
function drawGacha(userId) {
  // 아이템 뽑기
  const selectedItem = getStone();

  // 사용자의 아이템 수 증가
  db.run(`UPDATE user_stones SET "${selectedItem}" = "${selectedItem}" + 1 WHERE user_id = ?`, [userId], function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`뽑기 결과 ${selectedItem}을(를) 획득하였습니다.`);
  });
}

// 아이템 뽑기 함수
function getStone() {
  const stoneChances = [
    { name: 'SSS급 돌', weight: 0.01 },
    { name: 'SS급 돌', weight: 0.09 },
    { name: 'S급 돌', weight: 0.9 },
    { name: 'A급 돌', weight: 10 },
    { name: 'B급 돌', weight: 15 },
    { name: 'C급 돌', weight: 27 },
    { name: 'D급 돌', weight: 35 },
    { name: 'E급 돌', weight: 7 },
    { name: 'F급 돌', weight: 5 },
  ];

  // 아이템 뽑기
  let totalWeight = 0;
  for (const stone of stoneChances) {
    totalWeight += stone.weight;
  }

  let randomNumber = Math.random() * totalWeight;
  for (const stone of stoneChances) {
    if (randomNumber < stone.weight) {
      return stone.name;
    }
    randomNumber -= stone.weight;
  }
}

// 가입 처리 함수
function handleSignup(interaction) {
  const userId = interaction.user.id;
  const username = interaction.user.username;

  // 사용자 정보 데이터베이스에서 해당 사용자의 정보 조회
  db.get('SELECT * FROM user_stones WHERE user_id = ?', [userId], function (err, row) {
    if (err) {
      return console.error(err.message);
    }

    // 이미 가입된 사용자인 경우
    if (row) {
      interaction.reply(`${username}님, 이미 가입된 사용자입니다.`);
    } else {
      // 가입되지 않은 사용자인 경우, 데이터베이스에 추가
      db.run('INSERT INTO user_stones (user_id) VALUES (?)', [userId], function (err) {
        if (err) {
          return console.error(err.message);
        }
        console.log(`A row has been inserted with user_id ${userId}`);
      });

      // 가입 완료 메시지 응답
      interaction.reply(`${username}님, 가입이 완료되었습니다.`);
    }
  });
}

// 뽑기 처리 함수
function handleGacha(interaction) {
  const userId = interaction.user.id;
  const username = interaction.user.username;

  // 뽑기권 확인
  db.get('SELECT 뽑기권 FROM user_stones WHERE user_id = ?', [userId], function (err, row) {
    if (err) {
      return console.error(err.message);
    }

    // 사용자가 뽑기권을 보유하고 있는지 확인
    if (!row || row['뽑기권'] < 1) {
      interaction.reply(`${username}님, 뽑기권이 부족합니다.`);
      return;
    }

    // 뽑기권 소모
    db.run(`UPDATE user_stones SET "뽑기권" = "뽑기권" - 1 WHERE user_id = ?`, [userId], function (err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`${username}님의 뽑기권이 소모되었습니다.`);

      // 뽑기 실행
      const stone = getStone(userId);

      // 돌을 인벤토리에 추가
      db.run(`UPDATE user_stones SET "${stone}" = "${stone}" + 1 WHERE user_id = ?`, [userId], function (err) {
        if (err) {
          return console.error(err.message);
        }
        console.log(`사용자 ${userId}가 ${stone}을(를) 얻었습니다.`);
      });

      // 결과 메시지 응답
      interaction.reply(`${username}님, ${stone}을(를) 얻었습니다.`);
    });
  });
}

// 교환 처리 함수
function handleExchange(interaction, stoneGrade, exchangeQuantity) {
  const userId = interaction.user.id;
  const username = interaction.user.username;

  // 교환에 필요한 돌의 개수 및 교환 후 아이템 설정
  let exchangeCost, exchangeItem;
  switch (stoneGrade) {
    case 'F급 돌':
      exchangeCost = 5; // 각 등급별로 교환 비용을 정의
      exchangeItem = '짱아의 침이묻은 돌';
      break;
    case 'E급 돌':
      exchangeCost = 10;
      exchangeItem = '슬픈 짱구의 눈물이묻은 돌';
      break;
    case 'D급 돌':
      exchangeCost = 1;
      exchangeItem = '뽑기권';
      break;
    case 'C급 돌':
      exchangeCost = 3;
      exchangeItem = '뽑기권';
      break;
    case 'B급 돌':
      exchangeCost = 5;
      exchangeItem = '뽑기권';
      break;
    case 'A급 돌':
      exchangeCost = 10;
      exchangeItem = '뽑기권';
      break;
    case 'S급 돌':
      exchangeCost = 30;
      exchangeItem = '뽑기권';
      break;
    case 'SS급 돌':
      exchangeCost = 50;
      exchangeItem = '뽑기권';
      break;
    case 'SSS급 돌':
      exchangeCost = 1;
      exchangeItem = '최상급 맹구의 콧물이 묻은 맹구의 돌';
      break;
    default:
      interaction.reply(`${username}님, 잘못된 돌 등급입니다.`);
      return;
  }

  // 교환 처리
  const totalCost = exchangeCost * exchangeQuantity; // 총 교환 비용 계산
  db.get(`SELECT "${stoneGrade}" FROM user_stones WHERE user_id = ?`, [userId], function (err, row) {
    if (err) {
      return console.error(err.message);
    }

    // 해당 등급의 돌이 존재하는지 확인
    const stonesOwned = row[stoneGrade] || 0;
    if (stonesOwned === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('교환 실패')
        .setDescription(`${username}님, 보유한 ${stoneGrade} 등급의 돌이 없습니다.`);
      interaction.reply({ embeds: [embed] });
      return;
    }

    // 교환 가능한지 확인
    if (stonesOwned < exchangeQuantity) {
      const lackQuantity = exchangeQuantity - stonesOwned; // 부족한 돌의 개수 계산
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('교환 실패')
        .setDescription(`${username}님, ${lackQuantity}개의 ${stoneGrade}이 부족하여 ${exchangeItem}을(를) 교환할 수 없습니다.`);
      interaction.reply({ embeds: [embed] });
      return;
    }

    // 교환 처리
    db.run(`UPDATE user_stones 
            SET "${stoneGrade}" = "${stoneGrade}" - ?, 
                "${exchangeItem}" = COALESCE("${exchangeItem}", 0) + ? 
            WHERE user_id = ?`, 
            [exchangeQuantity, totalCost, userId], 
            function (err) {
      if (err) {
        return console.error(err.message);
      }
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('교환 성공')
        .setDescription(`${username}님이 ${exchangeQuantity}개의 ${stoneGrade}을 소모하여\n${totalCost}개의 ${exchangeItem}을(를) 교환하였습니다.`);
      interaction.reply({ embeds: [embed] });
    });
  });
}

function userAllStrons(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM user_stones WHERE user_id = ?`, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function userJoin(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM user_stones WHERE user_id = ?`, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
}


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {

  if (!interaction.isCommand()) return;

  if (interaction.commandName === '가입하기') {
    handleSignup(interaction);
  }

  if (interaction.commandName === '뽑기') {
    handleGacha(interaction);
  }

  if (interaction.commandName === '10연뽑기') {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    let i;

    // 뽑기권 확인
    db.get('SELECT 뽑기권 FROM user_stones WHERE user_id = ?', [userId], async function (err, row) {
      if (err) {
        return console.error(err.message);
      }

      // 사용자가 뽑기권을 보유하고 있는지 확인
      if (!row || row['뽑기권'] < 10) {
        interaction.reply(`${username}님, 뽑기권이 부족합니다.`);
        return;
      }

      // 뽑기권 소모
      db.run(`UPDATE user_stones SET "뽑기권" = "뽑기권" - 10 WHERE user_id = ?`, [userId], async function (err) {
        if (err) {
          return console.error(err.message);
        }
        console.log(`${username}님의 뽑기권 10개가 소모되었습니다.`);

        // 뽑기 실행 및 결과 메시지 응답
        let stonesObtained = {}; // 각 돌의 종류와 갯수를 저장할 객체
        for (i = 0; i < 10; i++) {
          const stone = await getStone(userId);
          if (stonesObtained[stone]) {
            stonesObtained[stone]++;
          } else {
            stonesObtained[stone] = 1;
          }

          // 돌을 인벤토리에 추가
          db.run(`UPDATE user_stones SET "${stone}" = "${stone}" + 1 WHERE user_id = ?`, [userId], function (err) {
            if (err) {
              return console.error(err.message);
            }
            console.log(`사용자 ${userId}가 ${stone}을(를) 얻었습니다.`);
          });
        }

        // 결과 메시지 응답
        let replyMessage = `${username}님, 뽑힌 돌: `;
        for (const [stone, count] of Object.entries(stonesObtained)) {
          replyMessage += `${stone} ${count}개, `;
        }
        replyMessage = replyMessage.slice(0, -2); // 마지막 쉼표 제거
        interaction.reply(replyMessage);
      });
    });
  }

  if (interaction.commandName === '채굴하기') {
    const userId = interaction.user.id;
    const username = interaction.user.username;

    // 강 채굴
    const stonesObtained = mineStones(userId);

    // 결과 메시지 응답
    if (stonesObtained === 0) {
      await interaction.reply(`와! 맹구의 짱돌을 얻으셨군요!`);
    } else {
      await interaction.reply(`${username}님, 채굴을 통해 ${stonesObtained}개의 강화석을 얻었습니다.`);
    }
  }


  if (interaction.commandName === '뽑기권구매') {
    const userId = interaction.user.id;
    const username = interaction.user.username;

    // 사용자의 강화석 개수 조회
    db.get('SELECT 강화석 FROM user_stones WHERE user_id = ?', [userId], function (err, row) {
      if (err) {
        return console.error(err.message);
      }

      // 강화석이 충분한지 확인
      if (!row || row['강화석'] < 10) {
        interaction.reply(`${username}님, 강화석이 부족하여 뽑기권을 구매할 수 없습니다.`);
        return;
      }

      // 강화석이 충분한 경우 뽑기권 구매 함수 호출
      purchaseGachaTicket(userId);

      // 결과 메시지 응답
      interaction.reply(`${username}님, 뽑기권을 구매하였습니다.`);
    });
  }

  if (interaction.commandName === '뽑기권10개구매') {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const cost = 100;

    // 사용자의 강화석 개수 조회
    db.get('SELECT 강화석 FROM user_stones WHERE user_id = ?', [userId], function (err, row) {
      if (err) {
        return console.error(err.message);
      }

      if (!row || row['강화석'] < 100) {
        interaction.reply(`${username}님, 강화석이 부족하여 뽑기권을 구매할 수 없습니다.`);
        return;
      }

      db.run(`UPDATE user_stones SET 강화석 = 강화석 - ?, 뽑기권 = 뽑기권 + 10 WHERE user_id = ?`, [cost, userId], function (err) {
        if (err) {
          return console.error(err.message);
        }
        console.log(`뽑기권 10개를 구매하였습니다.`);
      });

      // 결과 메시지 응답
      interaction.reply(`${username}님, 뽑기권 10개 구매하였습니다.`);
    });
  }


  if (interaction.commandName === '인벤토리') {
    try {
        let user_stone = await userAllStrons(interaction.user.id);
        
        const username = interaction.user.globalName;

        // 임베드 스타일 설정
        const embed = new EmbedBuilder()
            .setColor('#0099ff') // 임베드의 색상 설정
            .setTitle(`${username}님의 인벤토리`)
            .setDescription('보유한 돌 목록:')
            .setThumbnail(interaction.user.avatarURL())
            .setTimestamp()

          // 각 돌 종류에 대해 돌 개수가 0이 아닌 경우에만 추가
          if (user_stone['강화석'] !== 0) embed.addFields({ name: '강화석', value: `${user_stone['강화석']}개`, inline: false });
          if (user_stone['F급 돌'] !== 0) embed.addFields({ name: 'F급 돌', value: `${user_stone['F급 돌']}개`, inline: false });
          if (user_stone['E급 돌'] !== 0) embed.addFields({ name: 'E급 돌', value: `${user_stone['E급 돌']}개`, inline: false });
          if (user_stone['D급 돌'] !== 0) embed.addFields({ name: 'D급 돌', value: `${user_stone['D급 돌']}개`, inline: false });
          if (user_stone['C급 돌'] !== 0) embed.addFields({ name: 'C급 돌', value: `${user_stone['C급 돌']}개`, inline: false });
          if (user_stone['B급 돌'] !== 0) embed.addFields({ name: 'B급 돌', value: `${user_stone['B급 돌']}개`, inline: false });
          if (user_stone['A급 돌'] !== 0) embed.addFields({ name: 'A급 돌', value: `${user_stone['A급 돌']}개`, inline: false });
          if (user_stone['S급 돌'] !== 0) embed.addFields({ name: 'S급 돌', value: `${user_stone['S급 돌']}개`, inline: false });
          if (user_stone['SS급 돌'] !== 0) embed.addFields({ name: 'SS급 돌', value: `${user_stone['SS급 돌']}개`, inline: false });
          if (user_stone['SSS급 돌'] !== 0) embed.addFields({ name: 'SSS급 돌', value: `${user_stone['SSS급 돌']}개`, inline: false });
          if (user_stone['뽑기권'] !== 0) embed.addFields({ name: '뽑기권', value: `${user_stone['뽑기권']}개`, inline: false });

        // Embed를 사용자에게 보내기
        interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('인벤토리 조회 중 오류 발생:', error);
        interaction.reply('인벤토리 조회 중 오류가 발생했습니다.');
    }
}

  // 교환 기능 추가
  if (interaction.commandName === '교환하기') {
    const stoneGrade = interaction.options.getString('돌선택');
    const exchangeQuantity = interaction.options.getInteger('갯수');

    // 다른 등급의 돌을 교환
    handleExchange(interaction, stoneGrade, exchangeQuantity);
  }
});


client.login(TOKEN);
