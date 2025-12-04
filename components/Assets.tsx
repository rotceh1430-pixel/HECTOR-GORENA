import React, { useState } from 'react';
import { Asset, User, Role } from '../types';
import { QrCode, MapPin, Calendar, Activity, Laptop } from 'lucide-react';

interface AssetsProps {
  assets: Asset[];
  currentUser: User;
}

const Assets: React.FC<AssetsProps> = ({ assets, currentUser }) => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  if (currentUser.role === Role.CAJERO) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
            <Laptop className="w-16 h-16 mb-4 opacity-20" />
            <h2 className="text-xl font-bold">Acceso Restringido</h2>
            <p>El rol de Cajero no tiene acceso al módulo de Activos Fijos.</p>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8 pb-24 h-full bg-gray-50 overflow-y-auto">
      <h2 className="text-3xl font-bold text-coffee-900 mb-6">Activos Fijos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map(asset => (
          <div 
            key={asset.id} 
            onClick={() => setSelectedAsset(asset)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-coffee-300 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100">
                <Laptop className="w-6 h-6" />
              </div>
              <div className={`text-xs px-2 py-1 rounded-full border ${asset.status === 'Funcionando' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                {asset.status}
              </div>
            </div>
            
            <h3 className="font-bold text-gray-800 text-lg mb-1">{asset.name}</h3>
            <p className="text-sm text-gray-500 mb-4 font-mono">{asset.qrCode}</p>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{asset.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Adquirido: {asset.purchaseDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Detail Modal with "Fake" QR */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAsset(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 bg-gray-900 rounded-xl mb-4 flex items-center justify-center">
                    {/* Placeholder for real QR generation */}
                    <QrCode className="text-white w-20 h-20" />
                </div>
                <h3 className="text-xl font-bold text-center">{selectedAsset.name}</h3>
                <p className="text-gray-500 font-mono">{selectedAsset.qrCode}</p>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                    <span className="text-gray-500">Valor Libro</span>
                    <span className="font-bold">Bs {selectedAsset.value}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Ubicación</span>
                    <span>{selectedAsset.location}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Estado</span>
                    <span className={selectedAsset.status === 'Funcionando' ? 'text-green-600' : 'text-orange-600'}>
                        {selectedAsset.status}
                    </span>
                </div>
            </div>
            
            <button 
                onClick={() => setSelectedAsset(null)}
                className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold transition-colors"
            >
                Cerrar Ficha
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;