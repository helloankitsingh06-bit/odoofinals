import dotenv from 'dotenv';
dotenv.config();
import app from './app';

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 PeoplePay360 Backend running at http://localhost:${PORT}`);
});
