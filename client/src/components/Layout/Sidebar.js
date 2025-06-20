import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  useTheme,
  useMediaQuery,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  People,
  Event,
  Assignment,
  LocalPharmacy,
  Medication,
  Person,
  BarChart,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { setSidebarOpen } from '../../store/slices/uiSlice';

const Sidebar = ({ drawerWidth }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const getMenuItems = (userRole) => {
    const commonItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    ];

    const roleBasedItems = {
      admin: [
        { text: 'Bệnh nhân', icon: <People />, path: '/patients' },
        { text: 'Lịch hẹn', icon: <Event />, path: '/appointments' },
        { text: 'Hồ sơ y tế', icon: <Assignment />, path: '/medical-records' },
        { text: 'Đơn thuốc', icon: <LocalPharmacy />, path: '/prescriptions' },
        { text: 'Quản lý thuốc', icon: <Medication />, path: '/medicines' },
        { text: 'Báo cáo', icon: <BarChart />, path: '/reports' },
      ],
      doctor: [
        { text: 'Bệnh nhân', icon: <People />, path: '/patients' },
        { text: 'Lịch hẹn', icon: <Event />, path: '/appointments' },
        { text: 'Hồ sơ y tế', icon: <Assignment />, path: '/medical-records' },
        { text: 'Đơn thuốc', icon: <LocalPharmacy />, path: '/prescriptions' },
        { text: 'Thuốc', icon: <Medication />, path: '/medicines' },
      ],
      receptionist: [
        { text: 'Bệnh nhân', icon: <People />, path: '/patients' },
        { text: 'Lịch hẹn', icon: <Event />, path: '/appointments' },
        { text: 'Hồ sơ y tế', icon: <Assignment />, path: '/medical-records' },
      ],
    };

    const profileItem = { text: 'Hồ sơ cá nhân', icon: <Person />, path: '/profile' };

    // Kiểm tra userRole và fallback nếu không tồn tại
    const roleItems = roleBasedItems[userRole] || [];
    return [...commonItems, ...roleItems, profileItem];
  };

  const menuItems = getMenuItems(user?.role || 'guest');

  // Không render menu nếu user chưa được load
  if (!user) {
    return null;
  }

  const handleDrawerToggle = () => {
    if (isMobile) {
      dispatch(setSidebarOpen(!sidebarOpen));
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  };

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalPharmacy color="primary" />
          <Typography variant="h6" color="primary" fontWeight="bold">
            Phòng Khám
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={isActivePath(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActivePath(item.path) 
                    ? theme.palette.primary.contrastText 
                    : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isActivePath(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={sidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="persistent"
          open={sidebarOpen}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
