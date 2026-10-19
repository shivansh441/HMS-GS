const authService = {
  login: async (email: string, password: string) => {
    // Mock login
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@maharanapratap.com' && password === 'password') {
          resolve({
            user: { id: '1', name: 'Admin User', email, role: 'admin' },
            token: 'mock-token'
          });
        } else {
          reject('Invalid credentials. Use admin@maharanapratap.com / password');
        }
      }, 1500);
    });
  },
  register: async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    // Mock registration
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (data.email && data.password && data.firstName && data.lastName) {
          resolve({
            user: { 
              id: Date.now().toString(), 
              name: `${data.firstName} ${data.lastName}`, 
              email: data.email, 
              role: 'resident' 
            },
            token: 'mock-token'
          });
        } else {
          reject('Registration failed. Please fill in all fields.');
        }
      }, 1500);
    });
  },
  logout: () => {
    // Mock logout
  }
};

export default authService;
