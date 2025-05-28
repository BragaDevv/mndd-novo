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
  dataNascimento: any;
  id: string;
  nome: string;
  sobrenome: string;
  telefone?: string;
  endereco?: string;
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
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(
    null
  );
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
    const grupoMatch =
      grupoFiltro === null || (u.grupos || []).includes(grupoFiltro);
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
    const docRef = doc(db, "usuarios", usuarioSelecionado.id);

    try {
      await updateDoc(docRef, {
        grupos: usuarioSelecionado.grupos || [],
      });

      // Atualiza o usuário no array de usuários imediatamente
      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((u) =>
          u.id === usuarioSelecionado.id
            ? { ...u, grupos: usuarioSelecionado.grupos || [] }
            : u
        )
      );

      Alert.alert("Grupos atualizados!");
    } catch (err) {
      Alert.alert("Erro ao salvar grupos.");
    }
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
      <Text style={styles.title}>Gestão de Membros / Usuários</Text>
      <TextInput
        style={styles.input}
        placeholder="Buscar por nome"
        value={busca}
        onChangeText={setBusca}
      />

      <View style={styles.filtroContainer}>
        <TouchableOpacity
          style={[
            styles.filtroBotao,
            grupoFiltro === null && styles.filtroSelecionado,
          ]}
          onPress={() => setGrupoFiltro(null)}
        >
          <Ionicons name="people-circle-outline" size={16} color="#000" />
          <Text style={styles.filtroTexto}>Todos</Text>
        </TouchableOpacity>

        {gruposDisponiveis.map((grupo) => (
          <TouchableOpacity
            key={grupo}
            style={[
              styles.filtroBotao,
              grupoFiltro === grupo && styles.filtroSelecionado,
            ]}
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
          style={[
            styles.button,
            { backgroundColor: "#ff5722", marginBottom: 10 },
          ]}
          onPress={() => {
            setTituloGrupo(`Mensagem para ${grupoFiltro}`);
            setMensagemGrupo("");
            setModalGrupoVisible(true);
          }}
        >
          <Ionicons name="send-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>
            Enviar para todos de "{grupoFiltro}"
          </Text>
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
              <Text style={styles.userName}>
                {item.nome} {item.sobrenome}
              </Text>
              <View style={styles.tagsContainer}>
                {item.grupos?.map((grupo, idx) => (
                  <Text key={idx} style={styles.tag}>
                    {grupo}
                  </Text>
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
              <Text style={styles.modalTitle}>
                {usuarioSelecionado?.nome}
                {usuarioSelecionado?.sobrenome}
              </Text>

              {/* Info do usuário */}
              {usuarioSelecionado && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Telefone:</Text>{" "}
                    {usuarioSelecionado.telefone || "Não informado"}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Aniversário:</Text>{" "}
                    {usuarioSelecionado.dataNascimento}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Endereço:</Text>{" "}
                    {usuarioSelecionado.endereco}
                  </Text>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Membro:</Text>{" "}
                    {usuarioSelecionado.membro ? "Sim" : "Não"}
                  </Text>
                </View>
              )}

              <View style={styles.sectionUser}>
                <Text style={styles.sectionTitle}>Enviar Notificação</Text>
                <TextInput
                  style={styles.inputModal}
                  placeholder="Título"
                  placeholderTextColor="#999"
                  value={titulo}
                  onChangeText={setTitulo}
                />
                <TextInput
                  style={[styles.inputModal, { height: 80 }]}
                  placeholder="Mensagem"
                  placeholderTextColor="#999"
                  value={mensagem}
                  onChangeText={setMensagem}
                  multiline
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={enviarNotificacao}
                  >
                    <Text style={styles.buttonText}>Enviar</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* ////////////////////////////////////////// */}

              <View style={styles.sectionUser}>
                <Text style={styles.sectionTitle}>Grupos:</Text>
                <View style={styles.chipContainer}>
                  {gruposDisponiveis.map((grupo) => {
                    const selecionado =
                      usuarioSelecionado?.grupos?.includes(grupo);
                    return (
                      <TouchableOpacity
                        key={grupo}
                        style={[
                          styles.chip,
                          selecionado
                            ? styles.chipSelected
                            : styles.chipUnselected,
                        ]}
                        onPress={() => {
                          const atual = usuarioSelecionado?.grupos || [];
                          const novosGrupos = selecionado
                            ? atual.filter((g: string) => g !== grupo)
                            : [...atual, grupo];
                          setUsuarioSelecionado({
                            ...usuarioSelecionado!,
                            grupos: novosGrupos,
                          });
                        }}
                      >
                        <Text
                          style={
                            selecionado
                              ? styles.chipTextSelected
                              : styles.chipText
                          }
                        >
                          {grupo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: "#4caf50" }]}
                    onPress={salvarGrupos}
                  >
                    <Text style={styles.buttonText}>Salvar Grupos</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#000" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Grupo */}
      <Modal visible={modalGrupoVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitleGroup}>
                Notificar grupo "{grupoFiltro}"
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Título"
                placeholderTextColor="#999"
                value={tituloGrupo}
                onChangeText={setTituloGrupo}
              />
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Mensagem"
                placeholderTextColor="#999"
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
                  style={[styles.button, { backgroundColor: "#000" }]}
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
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
    backgroundColor: "#ffa962",
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
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "center",
  },

  infoBox: {
    backgroundColor: "#f9f9ff",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: "bold",
  },

  sectionUser: {
    backgroundColor: "#ffff",
    borderStyle: "solid",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },

  inputModal: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: "5%",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 15,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    marginHorizontal: 10,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 8,
    marginTop: 6,
  },
  chipSelected: { backgroundColor: "#ffa962" },
  chipUnselected: { backgroundColor: "#e0e0e0" },
  chipText: { color: "#333", fontWeight: "500" },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
  modalButtons: { flexDirection: "column", gap: 10, marginTop: 16 },
  button: {
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: "5%",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },

  modalTitleGroup: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 20,
    textAlign: "center",
  },
});
