import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

// Typage générique de la navigation
type RootStackParamList = {
  calendar: undefined;
  organisation: undefined;
  home: undefined;
  assignement: { page?: number; selectedDate?: string } | undefined;
  profile: undefined;
};

const Navbar: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    navbar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.colors.navbar,
      paddingVertical: 12,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
  });

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => navigation.navigate('calendar')}>
        <MaterialIcons
          name="calendar-month"
          size={30}
          color={theme.colors.navbarText}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('organisation')}>
        <MaterialIcons name="group" size={30} color={theme.colors.navbarText} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('home')}>
        <MaterialIcons name="home" size={30} color={theme.colors.navbarText} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('assignement')}>
        <MaterialIcons
          name="assignment"
          size={30}
          color={theme.colors.navbarText}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('profile')}>
        <MaterialIcons
          name="account-circle"
          size={30}
          color={theme.colors.navbarText}
        />
      </TouchableOpacity>
    </View>
  );
};

export default Navbar;
