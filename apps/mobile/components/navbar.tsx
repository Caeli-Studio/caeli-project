import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';

// Typage générique de la navigation
type RootStackParamList = {
    organisation: undefined;
    profile: undefined;
    // ajoute d’autres écrans si nécessaire
};

const Navbar: React.FC = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    return (
        <View style={styles.navbar}>
            <TouchableOpacity onPress={() => navigation.navigate('calendar')}>
                <MaterialIcons name="calendar-month" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('organisation')}>
                <MaterialIcons name="group" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('home')}>
                <MaterialIcons name="home" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('assignement')}>
                <MaterialIcons name="assignment" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('profile')}>
                <MaterialIcons name="account-circle" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#000000',
        paddingVertical: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
});

export default Navbar;
