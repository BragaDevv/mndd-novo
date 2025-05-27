// src/screens/EstudosScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { carregarDevocionais, gerarNovoDevocional, atualizarDevocional, Devocional } from '../services/devocionaisService';

const EstudosScreen = () => {
  const [devocionais, setDevocionais] = useState<Devocional[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [novoTema, setNovoTema] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedDevocional, setSelectedDevocional] = useState<Devocional | null>(null);

  // Sua chave da OpenAI (armazene de forma segura em produção)
  const OPENAI_API_KEY = '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';

  // Carrega devocionais ao iniciar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const dados = await carregarDevocionais();
        setDevocionais(dados);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os devocionais');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Gera novo devocional
  const handleGerarDevocional = async () => {
    if (!novoTema.trim()) {
      Alert.alert('Atenção', 'Digite um tema para o devocional');
      return;
    }

    setGerando(true);
    try {
      const novo = await gerarNovoDevocional(novoTema, OPENAI_API_KEY);
      const novosDevocionais = [novo, ...devocionais];
      
      setDevocionais(novosDevocionais);
      setNovoTema('');
      setSelectedTheme(null);
      setSelectedDevocional(novo);
      
      Alert.alert('Sucesso', 'Novo devocional criado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar o devocional. Verifique sua conexão ou tente outro tema.');
    } finally {
      setGerando(false);
    }
  };

  // Marcar como lido/não lido
  const toggleLido = async (id: string) => {
    try {
      const devocional = devocionais.find(d => d.id === id);
      if (!devocional) return;
      
      const atualizados = await atualizarDevocional(id, { lido: !devocional.lido });
      setDevocionais(atualizados);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o devocional');
    }
  };

  // Extrai temas únicos
  const temas = Array.from(new Set(devocionais.map(d => d.tema)));

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#075E54" />
      </View>
    );
  }

  if (selectedDevocional) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedDevocional(null)}
          >
            <MaterialIcons name="arrow-back" size={24} color="#075E54" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.tituloDevocional}>{selectedDevocional.titulo}</Text>
          <Text style={styles.temaDevocional}>Tema: {selectedDevocional.tema}</Text>
          
          <View style={styles.versiculoContainer}>
            <Text style={styles.versiculoText}>{selectedDevocional.versiculo}</Text>
          </View>
          
          <Text style={styles.textoDevocional}>{selectedDevocional.texto}</Text>
          
          <TouchableOpacity
            style={[styles.lidoButton, selectedDevocional.lido && styles.lidoButtonActive]}
            onPress={() => toggleLido(selectedDevocional.id)}
          >
            <Text style={styles.lidoButtonText}>
              {selectedDevocional.lido ? '✓ LIDO' : 'MARCAR COMO LIDO'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (selectedTheme) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedTheme(null)}
          >
            <MaterialIcons name="arrow-back" size={24} color="#075E54" />
            <Text style={styles.backText}>Todos os Temas</Text>
          </TouchableOpacity>

          <Text style={styles.temaTitle}>Tema: {selectedTheme}</Text>
          
          {devocionais
            .filter(d => d.tema === selectedTheme)
            .map(devocional => (
              <TouchableOpacity
                key={devocional.id}
                style={styles.cardDevocional}
                onPress={() => setSelectedDevocional(devocional)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitulo}>{devocional.titulo}</Text>
                  {devocional.lido && (
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                  )}
                </View>
                <Text style={styles.cardData}>{devocional.data}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Formulário para novo devocional */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          value={novoTema}
          onChangeText={setNovoTema}
          placeholder="Digite um tema para novo devocional"
          placeholderTextColor="#999"
          editable={!gerando}
        />
        <TouchableOpacity
          style={[styles.gerarButton, gerando && styles.gerarButtonDisabled]}
          onPress={handleGerarDevocional}
          disabled={gerando}
        >
          {gerando ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.gerarButtonText}>GERAR DEVOCIONAL</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Seção de Temas */}
        <Text style={styles.sectionTitle}>Explorar por Temas</Text>
        
        <View style={styles.temasContainer}>
          {temas.map(tema => (
            <TouchableOpacity
              key={tema}
              style={styles.temaCard}
              onPress={() => setSelectedTheme(tema)}
            >
              <Text style={styles.temaText}>{tema}</Text>
              <MaterialIcons name="chevron-right" size={24} color="#075E54" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Devocionais Recentes */}
        <Text style={styles.sectionTitle}>Devocionais Recentes</Text>
        
        {devocionais.slice(0, 3).map(devocional => (
          <TouchableOpacity
            key={devocional.id}
            style={styles.cardDevocional}
            onPress={() => setSelectedDevocional(devocional)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitulo}>{devocional.titulo}</Text>
              {devocional.lido && (
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              )}
            </View>
            <Text style={styles.cardTema}>{devocional.tema}</Text>
            <Text style={styles.cardData}>{devocional.data}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  formContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  input: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  gerarButton: {
    backgroundColor: '#075E54',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  gerarButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  gerarButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#075E54',
    fontSize: 16,
    marginLeft: 8,
  },
  temaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 16,
    textAlign: 'center',
  },
  temasContainer: {
    marginBottom: 16,
  },
  temaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  temaText: {
    fontSize: 16,
    color: '#333',
  },
  cardDevocional: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#075E54',
    flex: 1,
  },
  cardTema: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardData: {
    fontSize: 12,
    color: '#999',
  },
  tituloDevocional: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 8,
    textAlign: 'center',
  },
  temaDevocional: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  versiculoContainer: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  versiculoText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
    textAlign: 'center',
  },
  textoDevocional: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  lidoButton: {
    backgroundColor: '#E0E0E0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  lidoButtonActive: {
    backgroundColor: '#C8E6C9',
  },
  lidoButtonText: {
    color: '#075E54',
    fontWeight: 'bold',
  },
});

export default EstudosScreen;