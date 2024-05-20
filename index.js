const express = require('express')
const redis = require('redis')
const app = express()
const port = 3000
const redisPort = 6379;

const redisClient = redis.createClient(redisPort);
redisClient.on('connect', () => {
    console.log('Redis client connected');
});
redisClient.on('error', (err) => {
    console.log('Error: ${err}');
});

(async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error('Redis connection error:', err);
    }
  })();

app.get('/', (req, res) => {
    res.send('Enter the username in the url to check the repo');
});

const getNoOfRepos = async (username) => {
    const start = Date.now();
    const res = await redisClient.get(username);
    if (res!=null) {
        const end = Date.now();
        const timeTaken = end - start;
        return `${username} has ${res} repositories! it took ${timeTaken}ms to fetch the data while using redis caching`;
    }
    else{
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        if (response.status === 404) {
            throw new Error(`User ${username} does not exist`);
        }
        const data = await response.json();
        const end = Date.now();
        const timeTaken = end - start;
        redisClient.setEx(username, 3600, data.length.toString());
        return `${username} has ${data.length} repositories! it took ${timeTaken}ms to fetch the data while first time fetching`;
    }
};

app.get('/:username', (req, res) => {
    const username = req.params.username;
    getNoOfRepos(username)
        .then(data => res.send(data))
        .catch(err => res.send(err));
});

app.listen(port, () => {    
    console.log(`Server is running on port ${port}`);
});