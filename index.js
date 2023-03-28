const grid = document.querySelector('.grid')
const main = document.getElementById('main')

document.addEventListener('contextmenu', event => event.preventDefault());

const MOUSE_BUTTONS = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
}

let COLOR_GRID = '#f6bd60'
let COLOR_OBSTACLE = '#f28482'
let COLOR_ORIGIN = '#7f5539'
let COLOR_DESTINY = '#4361ee'
let COLOR_PATH = '#3bceac'

const inputColorGrid = document.getElementById('colorGrid')
inputColorGrid.addEventListener('input', el => {
  COLOR_GRID = el.target.value

  // update grid
  squares.forEach((square, index) => {
    if (index !== startPosition && index !== destinyPosition
      && (matrix[Math.floor(index / GRID_WIDTH)][index % GRID_HEIGHT] ?
        !matrix[Math.floor(index / GRID_WIDTH)][index % GRID_HEIGHT].obstacle : true)) {
      square.style.background = COLOR_GRID
    }
  })
})

const inputColorObstacle = document.getElementById('colorObstacle')
inputColorObstacle.addEventListener('input', el => {
  COLOR_OBSTACLE = el.target.value

  // update obstacles colors
  squares.forEach((square, index) => {
    if (matrix[Math.floor(index / GRID_WIDTH)][index % GRID_HEIGHT]
      && matrix[Math.floor(index / GRID_WIDTH)][index % GRID_HEIGHT].obstacle) {
      square.style.background = COLOR_OBSTACLE
    }
  })
})

const inputColorOrigin = document.getElementById('colorOrigin')
inputColorOrigin.addEventListener('input', el => {
  COLOR_ORIGIN = el.target.value
  if (squareStart) {
    squareStart.style.background = COLOR_ORIGIN
  }
})

const inputColorDestiny = document.getElementById('colorDestiny')
inputColorDestiny.addEventListener('input', el => {
  COLOR_DESTINY = el.target.value
  if (squareDestiny) {
    squareDestiny.style.background = COLOR_DESTINY
  }
})

const inputColorPath = document.getElementById('colorPath')
inputColorPath.addEventListener('input', el => {
  COLOR_PATH = el.target.value
})

const GRID_WIDTH = 24
const GRID_HEIGHT = 24

const SIZE_SQUARE = 20
const MARGIN_SQUARE = 1

const PADDING = 10

const evaluateWidth = () => {
  return GRID_WIDTH * SIZE_SQUARE + 4 * 1 * (GRID_WIDTH - 1) + 3 * PADDING
}

const evaluateHeight = () => {
  return GRID_HEIGHT * SIZE_SQUARE + 4 * 1 * (GRID_HEIGHT - 1) + 3 * PADDING
}

main.style.width = `${evaluateWidth()}px`
main.style.height = `${evaluateHeight()}px`


const matrix = [[]]

const startMatrix = () => {

  for (let i = 0; i < GRID_WIDTH; i++) {
    matrix[i] = []
    for (let j = 0; j < GRID_HEIGHT; j++) {
      matrix[i][j] = null
    }
  }
}

startMatrix()

let startPosition
let destinyPosition

let squareStart
let squareDestiny


for (let i = 0; i < GRID_WIDTH * GRID_HEIGHT; i++) {
  const square = document.createElement('div')
  square.className = 'square'

  square.addEventListener('mousedown', (event) => {
    switch (event.button) {
      case MOUSE_BUTTONS.LEFT:

        matrix[Math.floor(i / GRID_WIDTH)][i % GRID_HEIGHT] = { obstacle: true }
        square.style.background = COLOR_OBSTACLE
        break;
      case MOUSE_BUTTONS.CENTER:

        if (squareStart) {
          squareStart.style.background = COLOR_GRID
          matrix[Math.floor(startPosition / GRID_WIDTH)][startPosition % GRID_HEIGHT] = null
        } else {
          matrix[Math.floor(i / GRID_WIDTH)][i % GRID_HEIGHT] = { start: true }
          startPosition = i
        }

        square.style.background = COLOR_ORIGIN
        squareStart = square
        break;
      case MOUSE_BUTTONS.RIGHT:

        if (squareDestiny) {
          squareDestiny.style.background = COLOR_GRID
          matrix[Math.floor(destinyPosition / GRID_WIDTH)][destinyPosition % GRID_HEIGHT] = null
        } else {
          matrix[Math.floor(i / GRID_WIDTH)][i % GRID_HEIGHT] = { destiny: true }
          destinyPosition = i
        }

        square.style.background = COLOR_DESTINY
        squareDestiny = square
        break;
      default:

        break;
    }
  })
  grid.appendChild(square)
}

const squares = document.querySelectorAll('.square')

class Vertex {
  constructor({ label, visited, parent }) {
    this.label = label
    this.visited = visited
    this.parent = parent
    this.cost = 0
    this.destiny = false
  }
}

class Graph {
  constructor({ vertices }) {

    this.vertices = vertices
    this.adjacencyList = [[]]

    vertices.forEach((vertex, index) => {
      this.adjacencyList[index] = []
      this.adjacencyList[index].push(vertex)
    });
  }

  addEdge = (u, v) => {
    this.adjacencyList[u].push(this.vertices[v])
  }
}

let vertices = Array.from({ length: GRID_HEIGHT * GRID_WIDTH }, (_, i) => {
  return new Vertex({ label: i, visited: false, parent: null })
})

const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let g = new Graph({ vertices })

let velocity = 100

const slider = document.getElementById('slider')
slider.addEventListener('input', (el) => {
  velocity = el.target.value
})

const clearBoard = () => {
  startMatrix()

  vertices = Array.from({ length: GRID_HEIGHT * GRID_WIDTH }, (_, i) => {
    return new Vertex({ label: i, visited: false, parent: null })
  })

  g = new Graph({ vertices })

  squares.forEach(square => {
    square.style.background = COLOR_GRID
    square.classList.remove('onSearch')
  })

  squareDestiny = undefined
  squareStart = undefined
}

const solve = async () => {
  const queue = []

  let startIndex
  let destinyIndex

  for (let i = 0; i < GRID_WIDTH; i++) {
    for (let j = 0; j < GRID_HEIGHT; j++) {

      matrix[i][j] = matrix[i][j] || {}

      if (matrix[i][j].start) {
        startIndex = GRID_HEIGHT * i + j
      } else if (matrix[i][j].destiny) {
        destinyIndex = GRID_HEIGHT * i + j
      }

      if (j != GRID_HEIGHT - 1) {
        matrix[i][j + 1] = matrix[i][j + 1] || {}
      }
      if (i != GRID_WIDTH - 1) {
        matrix[i + 1][j] = matrix[i + 1][j] || {}
      }

      if (j != GRID_HEIGHT - 1 && (!matrix[i][j].obstacle && !matrix[i][j + 1].obstacle)) {
        g.addEdge(GRID_HEIGHT * i + j, GRID_HEIGHT * i + j + 1);
        g.addEdge(GRID_HEIGHT * i + j + 1, GRID_HEIGHT * i + j);
      }
      if (i != GRID_WIDTH - 1 && (!matrix[i][j].obstacle && !matrix[i + 1][j].obstacle)) {
        g.addEdge(GRID_HEIGHT * i + j, GRID_HEIGHT * (i + 1) + j);
        g.addEdge(GRID_HEIGHT * (i + 1) + j, GRID_HEIGHT * i + j);
      }
    }
  }

  let current = vertices[startIndex]

  queue.push(vertices[startIndex])
  vertices[startIndex].visited = true
  vertices[destinyIndex].destiny = true

  let minCost = Infinity

  let destiny

  // executing the bfs algorithm
  while (queue.length > 0) {
    current = queue.shift()
    for (let i = 0; i < g.adjacencyList[current.label].length; i++) {
      // melhorar o nome da variavel currentLabel
      let currentLabel = g.adjacencyList[current.label][i].label
      await sleep(101 - velocity)
      if (currentLabel != startIndex && !vertices[currentLabel].destiny) {
        squares[currentLabel].style.background = 'pink'
        squares[currentLabel].classList.add('onSearch')
      }
      if (!vertices[currentLabel].visited) {
        vertices[currentLabel].visited = true
        vertices[currentLabel].cost = 1 + current.cost
        vertices[currentLabel].parent = current

        if (vertices[currentLabel].cost < minCost && vertices[currentLabel].destiny) {
          minCost = vertices[currentLabel].cost
          destiny = vertices[currentLabel]
        }
        queue.push(vertices[currentLabel])
      }
    }
  }

  // drawing the path
  let parent = destiny
  while (parent !== null) {
    if (!parent.destiny && parent.parent) {
      squares[parent.label].style.background = COLOR_PATH
    }
    parent = parent.parent
  }

}