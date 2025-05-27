// ✅ Página completa: UsuariosScreen.tsx

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
} from "react-native";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

// Tipagem de usuário
interface Usuario {
    id: string;
    nome: string;
    telefone?: string;
    membro?: boolean;
    expoToken?: string;
    grupos?: string[];
}

const gruposDisponiveis = ["Louvor", "Irmãs", "Varões", "Jovens", "Diáconos"];

const UsuariosScreen = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [busca, setBusca] = useState("");
    const [grupoFiltro, setGrupoFiltro] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalGrupoVisible, setModalGrupoVisible] = useState(false);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
    const [titulo, setTitulo] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [tituloGrupo, setTituloGrupo] = useState("");
    const [mensagemGrupo, setMensagemGrupo] = useState("");

    useEffect(() => {
        const fetchUsuarios = async () => {
            const db = getFirestore();
            const usuariosRef = collection(db, "usuarios");
            const snapshot = await getDocs(usuariosRef);
            const data = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            })) as Usuario[];
            setUsuarios(data);
        };

        fetchUsuarios();
    }, []);

    const abrirModal = (usuario: Usuario) => {
        setUsuarioSelecionado(usuario);
        setTitulo("");
        setMensagem("");
        setModalVisible(true);
    };

    const usuariosFiltrados = usuarios.filter((u) => {
        const nomeMatch = u.nome.toLowerCase().includes(busca.toLowerCase());
        const grupoMatch = grupoFiltro === null || (u.grupos || []).includes(grupoFiltro);
        return nomeMatch && grupoMatch;
    });

    const contarUsuariosPorGrupo = (grupo: string) =>
        usuarios.filter((u) => u.grupos?.includes(grupo)).length;

    const enviarNotificacao = async () => {
        if (!titulo || !mensagem || !usuarioSelecionado?.expoToken) {
            Alert.alert("Preencha todos os campos e verifique o token.");
            return;
        }

        try {
            await fetch("https://mndd-backend.onrender.com/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: titulo,
                    body: mensagem,
                    to: usuarioSelecionado.expoToken,
                }),
            });

            Alert.alert("Sucesso", "Notificação enviada.");
            setModalVisible(false);
        } catch (err) {
            Alert.alert("Erro", "Falha ao enviar.");
        }
    };

    const salvarGrupos = async () => {
        if (!usuarioSelecionado) return;
        const db = getFirestore();
        await updateDoc(doc(db, "usuarios", usuarioSelecionado.id), {
            grupos: usuarioSelecionado.grupos || [],
        });
        Alert.alert("Grupos atualizados!");
    };

    const [loadingGrupo, setLoadingGrupo] = useState(false);

    const enviarParaGrupo = async () => {
        const tokens = usuarios
            .filter((u) => u.grupos?.includes(grupoFiltro!) && u.expoToken)
            .map((u) => u.expoToken!);

        if (tokens.length === 0) {
            Alert.alert("Nenhum usuário com token no grupo");
            return;
        }

        setLoadingGrupo(true);

        try {
            await fetch("https://mndd-backend.onrender.com/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: tituloGrupo,
                    body: mensagemGrupo,
                    tokens,
                }),
            });

            Alert.alert("Sucesso", "Notificação enviada para o grupo!");
            setModalGrupoVisible(false);
        } catch (err) {
            Alert.alert("Erro", "Falha ao enviar para o grupo.");
        } finally {
            setLoadingGrupo(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Usuários</Text>
            <TextInput
                style={styles.input}
                placeholder="Buscar por nome"
                value={busca}
                onChangeText={setBusca}
            />

            <View style={styles.filtroContainer}>
                <TouchableOpacity
                    style={[styles.filtroBotao, grupoFiltro === null && styles.filtroSelecionado]}
                    onPress={() => setGrupoFiltro(null)}
                >
                    <Ionicons name="people-circle-outline" size={16} color="#000" />
                    <Text style={styles.filtroTexto}>Todos</Text>
                </TouchableOpacity>

                {gruposDisponiveis.map((grupo) => (
                    <TouchableOpacity
                        key={grupo}
                        style={[styles.filtroBotao, grupoFiltro === grupo && styles.filtroSelecionado]}
                        onPress={() => setGrupoFiltro(grupo)}
                    >
                        <Ionicons name="pricetag-outline" size={16} color="#000" />
                        <Text style={styles.filtroTexto}>
                            {grupo} ({contarUsuariosPorGrupo(grupo)})
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {grupoFiltro && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: "#ff5722", marginBottom: 10 }]}
                    onPress={() => {
                        setTituloGrupo(`Mensagem para ${grupoFiltro}`);
                        setMensagemGrupo("");
                        setModalGrupoVisible(true);
                    }}
                >
                    <Ionicons name="send-outline" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Enviar para todos de "{grupoFiltro}"</Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={usuariosFiltrados}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.userItem}
                        onPress={() => abrirModal(item)}
                    >
                        <Ionicons name="person-circle-outline" size={24} color="#6200ee" />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.userName}>{item.nome}</Text>
                            <View style={styles.tagsContainer}>
                                {item.grupos?.map((grupo, idx) => (
                                    <Text key={idx} style={styles.tag}>{grupo}</Text>
                                ))}
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* Modal Individual */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Notificar {usuarioSelecionado?.nome}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Título"
                                value={titulo}
                                onChangeText={setTitulo}
                            />
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                placeholder="Mensagem"
                                value={mensagem}
                                onChangeText={setMensagem}
                                multiline
                            />

                            <Text style={styles.sectionTitle}>Grupos:</Text>
                            <View style={styles.chipContainer}>
                                {gruposDisponiveis.map((grupo) => {
                                    const selecionado = usuarioSelecionado?.grupos?.includes(grupo);
                                    return (
                                        <TouchableOpacity
                                            key={grupo}
                                            style={[styles.chip, selecionado ? styles.chipSelected : styles.chipUnselected]}
                                            onPress={() => {
                                                const atual = usuarioSelecionado?.grupos || [];
                                                const novosGrupos = selecionado
                                                    ? atual.filter((g: string) => g !== grupo)
                                                    : [...atual, grupo];
                                                setUsuarioSelecionado({ ...usuarioSelecionado!, grupos: novosGrupos });
                                            }}
                                        >
                                            <Text style={selecionado ? styles.chipTextSelected : styles.chipText}>{grupo}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.button} onPress={enviarNotificacao}>
                                    <Text style={styles.buttonText}>Enviar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, { backgroundColor: "#4caf50" }]} onPress={salvarGrupos}>
                                    <Text style={styles.buttonText}>Salvar Grupos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, { backgroundColor: "#888" }]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.buttonText}>Fechar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Modal Grupo */}
            <Modal visible={modalGrupoVisible} animationType="slide" transparent>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Notificar grupo "{grupoFiltro}"</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Título"
                                value={tituloGrupo}
                                onChangeText={setTituloGrupo}
                            />
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                placeholder="Mensagem"
                                value={mensagemGrupo}
                                onChangeText={setMensagemGrupo}
                                multiline
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.button, loadingGrupo && { opacity: 0.6 }]}
                                    onPress={enviarParaGrupo}
                                    disabled={loadingGrupo}
                                >
                                    <Text style={styles.buttonText}>
                                        {loadingGrupo ? "Enviando..." : "Enviar"}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: "#888" }]}
                                    onPress={() => setModalGrupoVisible(false)}
                                >
                                    <Text style={styles.buttonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

export default UsuariosScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#fff" },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
    },
    filtroContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    filtroBotao: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eee",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 6,
        marginBottom: 6,
    },
    filtroSelecionado: {
        backgroundColor: "#6200ee",
    },
    filtroTexto: {
        marginLeft: 4,
        color: "#000",
        fontWeight: "bold",
    },
    userItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#f0f0f0",
        borderRadius: 10,
        marginBottom: 10,
    },
    userName: { fontSize: 16, fontWeight: "500" },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 4,
    },
    tag: {
        backgroundColor: "#e0e0e0",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 12,
        color: "#333",
        marginRight: 4,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        width: "90%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 12,
        marginBottom: 4,
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 8,
        marginTop: 6,
    },
    chipSelected: { backgroundColor: "#6200ee" },
    chipUnselected: { backgroundColor: "#e0e0e0" },
    chipText: { color: "#333", fontWeight: "500" },
    chipTextSelected: { color: "#fff", fontWeight: "600" },
    modalButtons: { flexDirection: "column", gap: 10, marginTop: 16 },
    button: {
        backgroundColor: "#6200ee",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },
    buttonText: { color: "#fff", fontWeight: "bold" },
});
