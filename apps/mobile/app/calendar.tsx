import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Modal, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Navbar from "@/components/navbar";
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  assignement: { page: number; selectedDate: string };
  myCalendar: undefined; // si tu as d'autres écrans
};


const { width } = Dimensions.get('window');

const MyCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'myCalendar'>>();

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  const handleAddPress = () => {
    setModalVisible(false);
    navigation.navigate('assignement', { page: 1, selectedDate });
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: '#00adf5' },
          }}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalDate}>{selectedDate}</Text>
                <Text style={styles.modalText}>Aucune tâche de prévue ...</Text>
                <TouchableOpacity onPress={handleAddPress}>
                  <MaterialIcons name="add-circle" size={60} color="#FFF" />
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


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#C5BD83'
    },
    calendarWrapper: {
        width: width * 0.8,
        borderRadius: 10,
        overflow: 'hidden',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '70%',
        backgroundColor: '#D9D9D9',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 10,
        color : '#898989'
    },
    modalDate: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color : '#898989'
    },
});

export default MyCalendar;
