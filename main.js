// !!定義遊戲狀態!!
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
}

const autoplayBtn = document.querySelector('#auto-play') // autoplay add


const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

const view = {
  // 生成卡片框架: 綁定index
  getCardElement(index) {
    return `<div class="card back" data-index="${index}"></div>`
  },
  // 生成卡片內容(花色&數字)
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>
    `
  },
  // 運算花色&數字
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  // 選出 #cards 並抽換內容
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },
  // 翻牌機制
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        // 翻成正面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      // 翻回背面
      card.classList.add('back')
      card.innerHTML = null // 同 card.innerHTML = ''
    })
  },
  // 配對成功時的樣式變化
  pairCards(...cards) {
    cards.map(card => card.classList.add('paired'))
  },
  // 計算分數
  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`
  },
  // 計算時間
  renderTimer(seconds) {
    document.querySelector('.timer').innerText = `Time Passing: ${seconds}s`
  },
  // 計算嘗試次數
  renderTriedTimes(times) {
    document.querySelector('.tried').innerText = `You've tried: ${times} times`
  },
  // 配對失敗 CSS 動畫
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event =>
        event.target.classList.remove('wrong'), { once: true })
    })
  },
  // 顯示遊戲結束畫面
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've spent: ${model.seconds} seconds</p>
      <p>You've tried: ${model.triedTimes} times</p>
      <button type="button" class="btn btn-primary btn-sm" onclick="setNewGame()">Try Again</button>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

const model = {
  autoPlayInterval: undefined,
  countSecInterval: undefined,
  cardAmount: 52,
  isAutoplay: false, // autoplay add: 初始非 AUTOPLAY MODE
  revealedCards: [], // 代表「被翻開的卡片」
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  getScore: 10,
  maxScore: 260,
  seconds: 0,
  countSecond() {
    countSecInterval = setInterval(counting, 1000)
    function counting() {
      model.seconds++
      view.renderTimer(model.seconds)
    }
  },
  triedTimes: 0
}

const controller = {
  currentState: GAME_STATE.FirstCardAwaits, // 定義初始狀態: FirstCardAwaits
  // 初始生成 52 張牌
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(model.cardAmount))
  },
  // 依遊戲狀態來分配動作
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) { // 表示此牌狀態為「翻開」，再次點擊也不應該執行動作
      return
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        // 首次開始: timer 為 0 時，觸發計時
        if (model.triedTimes === 0) { 
          model.countSecond()
        }
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功(檢查翻開的兩張卡是否數字相同)
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += model.getScore)
          this.currentState = GAME_STATE.CardsMatched
          // view.pairCard(model.revealedCards[0])
          // view.pairCard(model.revealedCards[1])
          view.pairCards(...model.revealedCards)
          model.revealedCards = [] // 清空暫存的 revealedCards
           
          if (model.score === model.maxScore) { // 若分數達 260 分，則遊戲結束
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            clearInterval(countSecInterval) // 清除 countSecInterval 停止計秒
            endAutoplay()  // 不管如何，都終止 autoplay
            autoplayBtn.setAttribute('disabled', null) // 讓 autoplay button 失效
            view.showGameFinished()
            return
          }
          
          this.currentState = GAME_STATE.FirstCardAwaits  // 遊戲狀態改回 FirstCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)  // 顯示動畫
          setTimeout(this.resetCards,1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  // 清除卡片樣式
  resetCards() {
    // view.flipCard(model.revealedCards[0])
    // view.flipCard(model.revealedCards[1])
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

const utility = {
  // Fisher-Yates Shuffle 洗牌演算法
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

controller.generateCards() // 由 controller 統一發派

// Node List(array-like)
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})


// !! autoplay functions //////////////////

// 點擊 AUTOPLAY Button
autoplayBtn.addEventListener('click', event => {
  if (!model.isAutoplay) {  // 點擊, 進入 AUTOPLAY MODE
    startAutoplay()
  } else { // 點擊 ,取消 AUTOPLAY MODE
    endAutoplay()
  }
})
// 開始 autoplay 機制
function startAutoplay() {
  model.isAutoplay = true
  console.log('isAutoPlay:', model.isAutoplay)
  autoplayBtn.innerText = 'STOP AUTOing'
  autoplayBtn.classList.add('activated')
  autoplayBtn.classList.add('btn-danger')
  autoplayBtn.classList.remove('btn-info')
  autoPlaying()
}
// 結束 autoplay 機制
function endAutoplay() {
  model.isAutoplay = false
  console.log('isAutoPlay:', model.isAutoplay)
  autoplayBtn.innerText = 'AUTOPLAY'
  autoplayBtn.classList.remove('activated')
  autoplayBtn.classList.remove('btn-danger')
  autoplayBtn.classList.add('btn-info')
  clearInterval(autoPlayInterval)
}
// 隨機取 Index (依照 Array 剩餘總長度選擇)
function getRandomIndex(array) {
  return Math.floor(Math.random() * array.length)
}
// 執行 autoplay ing
function autoPlaying() {
  autoPlayInterval = setInterval(() => {
    const notFlippedArr = Array.from(document.querySelectorAll('.back'))
    const autoFlipped = notFlippedArr[getRandomIndex(notFlippedArr)]
    console.log('autoFlippedCard: ',autoFlipped)
    controller.dispatchCardAction(autoFlipped)
  }, 2000)
}

// restart the game
function setNewGame() {
  console.log('NewGame')
  document.querySelector('body').firstElementChild.remove()
  // model 變數全回原始值
  autoplayBtn.removeAttribute('disabled') // 讓 autoplay button 恢復作用
  controller.currentState = GAME_STATE.FirstCardAwaits
  model.autoPlayInterval = undefined
  model.countSecInterval = undefined
  model.isAutoplay = false
  model.revealedCards = []
  view.renderScore(model.score = 0)
  view.renderTimer(model.seconds = 0)
  view.renderTriedTimes(model.triedTimes = 0)
  controller.generateCards()
  // 沒加下述 reset 後跑不動, but why?
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', event => {
      controller.dispatchCardAction(card)
    })
  })
}