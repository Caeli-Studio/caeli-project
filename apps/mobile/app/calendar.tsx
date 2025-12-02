import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import Navbar from '@/components/navbar';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  assignement: { page?: number; selectedDate?: string };
  calendar: { page?: number };
};

const MyCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const handleAddPress = () => {
    setModalVisible(false);
    navigation.navigate('assignement', { page: 1, selectedDate });
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    calendarWrapper: {
      width: width * 0.8,
      borderRadius: 10,
      overflow: 'hidden',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '70%',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
    },
    modalText: {
      fontSize: 16,
      marginBottom: 10,
      color: theme.colors.textSecondary,
    },
    modalDate: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: theme.colors.primary,
            },
          }}
          theme={{
            backgroundColor: theme.colors.surface,
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.text,
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.textTertiary,
            monthTextColor: theme.colors.text,
            textMonthFontWeight: 'bold',
            arrowColor: theme.colors.primary,
          }}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Overlay qui capte les touches */}
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            {/* Fenêtre interne qui n'est pas cliquable pour fermer */}
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalDate}>{selectedDate}</Text>
                <Text style={styles.modalText}>Aucune tâche de prévue ...</Text>
                <TouchableOpacity onPress={handleAddPress}>
                  <MaterialIcons
                    name="add-circle"
                    size={60}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Navbar />
    </View>
  );
};

export default MyCalendar;
