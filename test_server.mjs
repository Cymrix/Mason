import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
app.post('/log', (req, res) => {
  console.log('[BROWSER]', req.body);
  res.send('ok');
});
app.listen(3001, () => console.log('Log server on 3001'));
