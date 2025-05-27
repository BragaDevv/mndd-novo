// src/services/devocionaisService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const CHAVE_ARMAZENAMENTO = '@MNDD:devocionais';

export interface Devocional {
  id: string;
  titulo: string;
  tema: string;
  texto: string;
  versiculo: string;
  data: string;
  lido: boolean;
}

// Armazena os devocionais localmente
export const salvarDevocionais = async (devocionais: Devocional[]) => {
  try {
    await AsyncStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(devocionais));
  } catch (error) {
    console.error('Erro ao salvar devocionais:', error);
    Alert.alert('Erro', 'Não foi possível salvar os devocionais localmente');
  }
};

// Carrega devocionais do armazenamento local
export const carregarDevocionais = async (): Promise<Devocional[]> => {
  try {
    const dados = await AsyncStorage.getItem(CHAVE_ARMAZENAMENTO);
    return dados ? JSON.parse(dados) : [];
  } catch (error) {
    console.error('Erro ao carregar devocionais:', error);
    return [];
  }
};

// Gera novo devocional usando IA
export const gerarNovoDevocional = async (tema: string, openAIKey: string): Promise<Devocional> => {
  try {
    // Gera o prompt para a IA
    const prompt = `Crie um devocional cristão completo sobre o tema "${tema}" com:
    - Título criativo
    - Versículo bíblico relevante (formato "Livro X:Y")
    - Texto de reflexão de 3 parágrafos
    - Aplicação prática
    Retorne em formato JSON com as chaves: titulo, versiculo, texto`;

    // Chama a API da OpenAI (usando sua implementação existente)
    const resposta = await chamarOpenAI(prompt, openAIKey);
    
    // Extrai os dados da resposta
    const dados = extrairDadosDaResposta(resposta);

    const novoDevocional: Devocional = {
      id: Date.now().toString(),
      titulo: dados.titulo || `Devocional sobre ${tema}`,
      tema: tema,
      texto: dados.texto || `Reflexão sobre ${tema}.`,
      versiculo: dados.versiculo || 'Salmo 23:1',
      data: new Date().toLocaleDateString('pt-BR'),
      lido: false
    };

    return novoDevocional;
  } catch (error) {
    console.error('Erro ao gerar devocional:', error);
    throw new Error('Não foi possível gerar o devocional');
  }
};

// Função para chamar a OpenAI (similar à que você já usa)
const chamarOpenAI = async (prompt: string, apiKey: string) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente cristão especializado em criar devocionais bíblicos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na chamada da OpenAI:', error);
    throw error;
  }
};

// Extrai os dados da resposta da OpenAI
const extrairDadosDaResposta = (resposta: any) => {
  try {
    const content = resposta.choices[0]?.message?.content;
    if (!content) throw new Error('Resposta vazia');
    
    const parsed = JSON.parse(content);
    return {
      titulo: parsed.titulo,
      versiculo: parsed.versiculo,
      texto: parsed.texto
    };
  } catch (error) {
    console.error('Erro ao processar resposta:', error);
    return {
      titulo: '',
      versiculo: '',
      texto: ''
    };
  }
};

// Atualiza um devocional existente
export const atualizarDevocional = async (id: string, atualizacoes: Partial<Devocional>) => {
  try {
    const devocionais = await carregarDevocionais();
    const atualizados = devocionais.map(d => 
      d.id === id ? { ...d, ...atualizacoes } : d
    );
    
    await salvarDevocionais(atualizados);
    return atualizados;
  } catch (error) {
    console.error('Erro ao atualizar devocional:', error);
    throw error;
  }
};