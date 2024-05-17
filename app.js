const express = require('express')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

app.use(express.json())

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running...!')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertPlayersDBObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchDBObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersDetails = `
    
    SELECT
     *
    FROM
     player_details
    ORDER BY
     player_id;`

  const playersArray = await db.all(getPlayersDetails)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayersDBObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params

  const getPlayerDetails = `
  
  SELECT
   *
  FROM
   player_details
  WHERE
   player_id = ${playerId};`

  const playerDetails = await db.get(getPlayerDetails)
  response.send(convertPlayersDBObjectToResponseObject(playerDetails))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body

  const {playerName} = playerDetails

  const updatePlayerDetails = `
  
  UPDATE 
   player_details
  SET
   player_name = '${playerName}'
  WHERE
   player_id = ${playerId};`

  await db.run(updatePlayerDetails)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId', async (request, response) => {
  const {matchId} = request.params

  const getMatchDetails = `
  
  SELECT
   *
  FROM
   match_details
  WHERE
   match_id = ${matchId};`

  const matchArray = await db.get(getMatchDetails)
  response.send(convertMatchDBObjectToResponseObject(matchArray))
})

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params

  const getMatchDetails = `
  
  SELECT
   *
  FROM player_match_score
   NATURAL JOIN match_details
  WHERE
   player_id = ${playerId};`

  const matchArray = await db.all(getMatchDetails)
  response.send(
    matchArray.map(eachMatch =>
      convertMatchDBObjectToResponseObject(eachMatch),
    ),
  )
})

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params

  const getMatchQuery = `
  
  SELECT
   *
  FROM player_match_score
   NATURAL JOIN player_details
  WHERE 
   match_id = ${matchId};`

  const playersArray = await db.all(getMatchQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayersDBObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params

  const getPlayerMatchDetails = `
  
  SELECT
   player_details.player_id AS playerId,
   player_details.player_name AS playerName,
   SUM(player_match_score.score) AS totalScore,
   SUM(fours) AS totalfours,
   SUM(sixes) AS totalSixes
  
  FROM 
   player_details INNER JOIN player_match_score
  ON
   player_details.player_id = player_match_score.player_id
  WHERE
   player_details.player_id = ${playerId};`

  const playerScore = await db.get(getPlayerMatchDetails)
  response.send(playerScore)
})

module.exports = app
