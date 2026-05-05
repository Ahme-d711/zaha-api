import axios from 'axios';

async function testDashboardStats() {
  try {
    // Note: This requires an admin token, but we can just check if the route exists and if it crashes
    const response = await axios.get('https://zaha-api.vercel.app//api/v1/dashboard/stats');
    console.log('Stats:', response.data);
  } catch (error: any) {
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
  }
}

testDashboardStats();
