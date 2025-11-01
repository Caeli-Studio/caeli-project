import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    TextInput,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Navbar from "@/components/navbar";
import { useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const Assignement = () => {
    const [activePage, setActivePage] = useState(0);
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskAssignement, setTaskAssignement] = useState('');
    const [taskImportance, setTaskImportance] = useState('');

    const [tasks, setTasks] = useState<
        { name: string; description: string; assignement: string; importance: string }[]
    >([]);

    const [importanceOpen, setImportanceOpen] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const route = useRoute();
    const dateSelected = route.params?.selectedDate;

    const [taskDate, setTaskDate] = useState(dateSelected || new Date().toISOString().split('T')[0]);


    const importanceOptions = [
        { label: "Faible", value: "faible", color: "green" },
        { label: "Moyenne", value: "moyenne", color: "orange" },
        { label: "Élevée", value: "elevee", color: "red" },
    ];

    useEffect(() => {
        if (route.params?.page === 1) {
            setActivePage(1);
            scrollViewRef.current?.scrollTo({ x: width * 0.82, animated: true });
        }
    }, [route.params]);

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

        const newTask = {
            name: taskName,
            description: taskDescription,
            assignement: taskAssignement,
            importance: taskImportance,
            date: taskDate,
        };

        setTasks((prev) => [...prev, newTask]);

        setTaskName('');
        setTaskDescription('');
        setTaskAssignement('');
        setTaskImportance('');

        // Revenir à la première page
        setActivePage(0);
        scrollViewRef.current?.scrollTo({ x: 0, animated: true });
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
                        ref={scrollViewRef}
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
                                {index === 0 ? (
                                    tasks.length === 0 ? (
                                        <Text style={styles.message}>{page.text}</Text>
                                    ) : (
                                        <ScrollView
                                            style={{ width: '100%', maxHeight: 250 }} // hauteur limitée pour scroll
                                            showsVerticalScrollIndicator={true}
                                        >
                                            {tasks.map((task, i) => (
                                                <View key={i} style={styles.taskBox}>
                                                    <Text style={styles.taskTitle}>{task.name}</Text>
                                                    {task.description && <Text style={styles.taskDesc}>{task.description}</Text>}
                                                    {task.assignement && <Text style={styles.taskAssign}>👤 {task.assignement}</Text>}

                                                    {task.importance && (
                                                        <View style={styles.importanceRow}>
                                                            <View
                                                                style={[
                                                                    styles.importanceDot,
                                                                    {
                                                                        backgroundColor:
                                                                            task.importance === 'Faible'
                                                                                ? 'green'
                                                                                : task.importance === 'Moyenne'
                                                                                    ? 'orange'
                                                                                    : 'red',
                                                                    },
                                                                ]}
                                                            />
                                                            <Text style={styles.taskImportanceText}>{task.importance}</Text>
                                                        </View>
                                                    )}

                                                    {/* Date sur une ligne séparée */}
                                                    <Text style={styles.taskDate}>📅 {task.date}</Text>
                                                </View>
                                            ))}

                                        </ScrollView>
                                    )
                                ) : (
                                    // Deuxième page : formulaire
                                    <>
                                        <Text style={styles.message}>{page.text}</Text>

                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nom de la tâche"
                                            value={taskName}
                                            onChangeText={setTaskName}
                                        />

                                        <TextInput
                                            style={styles.input}
                                            placeholder="Description de la tâche ..."
                                            value={taskDescription}
                                            onChangeText={setTaskDescription}
                                        />

                                        <TextInput
                                            style={styles.input}
                                            placeholder="Assigner à"
                                            value={taskAssignement}
                                            onChangeText={setTaskAssignement}
                                        />

                                        <TouchableOpacity
                                            style={styles.input}
                                            onPress={() => setImportanceOpen(!importanceOpen)}
                                        >
                                            <Text>{taskImportance || "Importance"}</Text>
                                        </TouchableOpacity>

                                        {importanceOpen && (
                                            <View style={styles.dropdown}>
                                                {importanceOptions.map((option) => (
                                                    <TouchableOpacity
                                                        key={option.value}
                                                        style={styles.dropdownOption}
                                                        onPress={() => {
                                                            setTaskImportance(option.label);
                                                            setImportanceOpen(false);
                                                        }}
                                                    >
                                                        <View
                                                            style={[styles.colorCircle, { backgroundColor: option.color }]}
                                                        />
                                                        <Text style={{ marginLeft: 8 }}>{option.label}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}

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
                                style={[styles.dot, activePage === index && styles.activeDot]}
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

    dropdown: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
        marginTop: 5,
        zIndex: 100,
    },

    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    colorCircle: {
        width: 14,
        height: 14,
        borderRadius: 6,
    },

    taskBox: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },

    taskDesc: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },

    taskAssign: {
        fontSize: 13,
        color: '#444',
        marginTop: 4,
    },

    taskImportance: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#E74C3C',
        marginTop: 4,
    },

    importanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },

    importanceDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },

    taskImportanceText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 6,
    },

    taskDate: {
        fontSize: 13,
        color: '#555',
        marginTop: 4,
    },

});

export default Assignement;
