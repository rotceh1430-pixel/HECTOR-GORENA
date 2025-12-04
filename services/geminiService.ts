import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeBusinessData = async (sales: Sale[], products: Product[]): Promise<string> => {
  if (!apiKey) return "API Key no configurada.";

  const lowStock = products.filter(p => p.stock < p.minStock).map(p => p.name);
  const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
  
  const prompt = `
    Actúa como un consultor de negocios experto para una cafetería de alfajores.
    Aquí tienes los datos actuales:
    
    1. Productos con stock crítico: ${lowStock.join(', ') || 'Ninguno'}.
    2. Ventas totales registradas recientemente: Bs ${totalSales.toFixed(2)}.
    3. Cantidad de transacciones: ${sales.length}.
    
    Proporciona un análisis breve de 1 párrafo y 3 recomendaciones puntuales de marketing o gestión de inventario.
    Usa un tono profesional pero motivador.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Error al conectar con el asistente de IA.";
  }
};