import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';

import AppBar from './AppBar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen } = useSelector((state) => state.ui);

  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar drawerWidth={drawerWidth} />
      <Sidebar drawerWidth={drawerWidth} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%',
            xs: '100%' 
          },
          ml: { 
            md: sidebarOpen ? `${drawerWidth}px` : 0,
            xs: 0 
          },
          mt: '64px', // AppBar height
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
