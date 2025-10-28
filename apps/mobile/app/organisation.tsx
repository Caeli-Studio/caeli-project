import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Profile = () => {
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
                    {/* Scroll horizontal interne */}
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >
                        {/* Page 1 */}
                        <View style={[styles.innerContent, { width: width * 0.8 }]}>
                            <Text style={styles.message}>
                                vous n’appartenez à aucune organisation ...{'\n\n'}
                                créer une organisation{'\n'}
                                en cliquant ci-dessous
                            </Text>
                            <TouchableOpacity activeOpacity={0.7}>
                                <MaterialIcons name="add-circle" size={60} color="#898989" />
                            </TouchableOpacity>
                            <View style={styles.circleContainer}>
                                <View style={styles.circle} />
                                <View style={styles.circle} />
                            </View>
                        </View>

                        {/* Page 2 */}
                        <View style={[styles.innerContent, { width: width * 0.8 }]}>
                            <Text style={styles.message}>Deuxième page de contenu</Text>
                        </View>

                        {/* Page 3 */}
                        <View style={[styles.innerContent, { width: width * 0.8 }]}>
                            <Text style={styles.message}>Troisième page de contenu</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>

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
        justifyContent: 'center', // centre verticalement la carte
        alignItems: 'center',     // centre horizontalement la carte
    },

    card: {
        backgroundColor: '#D9D9D9',
        borderRadius: 10,
        padding: 16,
        maxWidth: '90%',
        height: 350,           // hauteur fixe raisonnable
        alignItems: 'center',
        justifyContent: 'center', // centre contenu horizontal et vertical
    },

    scrollContainer: {
        alignItems: 'center',
    },

    innerContent: {
        alignItems: 'center',
        justifyContent: 'center', // centre contenu verticalement
        marginHorizontal: 10,
    },

    message: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#898989',
        textAlign: 'center',
        marginBottom: 12,
    },

    circleContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },

    circle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#898989',
    },
});

export default Profile;
