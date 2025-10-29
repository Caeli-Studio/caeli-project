import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Navbar from "@/components/navbar";

const { width } = Dimensions.get('window');

const Organisation = () => {
    const [activePage, setActivePage] = useState(0);
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');

    const pages = [
        { text: "Vous n'avez aucune tâche de prévue pour le moment" },
        { text: "Nouvelle tâche" },
    ];

    const handleScroll = (event: any) => {
        const pageIndex = Math.round(event.nativeEvent.contentOffset.x / (width * 0.8));
        setActivePage(pageIndex);
    };

    const handleAddTask = () => {
        if (!taskName.trim()) {
            Alert.alert("Erreur", "Veuillez entrer le nom de la tâche.");
            return;
        }
        Alert.alert("Tâche ajoutée", `Nom: ${taskName}\nDescription: ${taskDescription}`);
        setTaskName('');
        setTaskDescription('');
    };


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {['settings', 'logout'].map((icon) => (
                    <TouchableOpacity key={icon}>
                        <MaterialIcons name={icon} size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Contenu centré */}
            <View style={styles.centeredContent}>
                <View style={styles.card}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleScroll}
                        contentContainerStyle={{
                            alignItems: 'center',
                            height: '100%',
                        }}
                    >
                        {pages.map((page, index) => (
                            <View style={styles.innerContent} key={index}>
                                <Text style={styles.message}>{page.text}</Text>

                                {index === 1 && (
                                    <>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nom de la tâche"
                                            value={taskName}
                                            onChangeText={setTaskName}
                                        />

                                        <TextInput
                                            style={styles.input}
                                            placeholder="Déscription de la tâche ..."
                                            value={taskDescription}          // <-- ici
                                            onChangeText={setTaskDescription} // <-- et ici
                                        />


                                        <TouchableOpacity style={styles.buttonAdd} onPress={handleAddTask}>
                                            <Text style={styles.buttonText}>Ajouter la tâche</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Dots */}
                    <View style={styles.dotContainer}>
                        {pages.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    activePage === index && styles.activeDot,
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </View>

            <Navbar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#C5BD83' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
    },

    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    card: {
        backgroundColor: '#D9D9D9',
        borderRadius: 10,
        padding: 16,
        maxWidth: '90%',
        height: 350,
        alignItems: 'center',
        justifyContent: 'center',
    },

    innerContent: {
        width: width * 0.82,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    message: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#898989',
        textAlign: 'center',
        marginBottom: 12,
    },

    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        backgroundColor: '#fff',
    },

    buttonAdd: {
        backgroundColor: '#898989',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },

    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },

    dotContainer: {
        flexDirection: 'row',
        marginTop: 16,
        justifyContent: 'center',
    },

    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#C0C0C0',
        marginHorizontal: 4,
    },

    activeDot: {
        backgroundColor: '#898989',
    },
});

export default Organisation;
