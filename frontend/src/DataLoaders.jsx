import axios, { endpoints } from '/src/utils/axios';

export async function summaryLoader({ params }) {
  const response = await axios.get(endpoints.summary+`?invitation=${params.invite_id}`);
  const data = await response.data
  return data;
}