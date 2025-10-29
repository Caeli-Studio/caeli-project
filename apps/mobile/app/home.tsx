import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Navbar from '../components/navbar';

const Home: React.FC = () => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.text}>Well done!</Text>
            </View>

            <Navbar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#C5BD83'
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 60 },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333' },
});

export default Home;
