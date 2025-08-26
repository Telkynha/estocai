"""
Módulo para gerenciamento de cache

Este módulo implementa funções para salvar e recuperar resultados em cache,
reduzindo a necessidade de chamadas repetidas à API para os mesmos dados.
"""
import os
import json
import time
import hashlib
import threading
import logging

# Configura o logging
logging.basicConfig(
    filename='cache.log', 
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('cache_manager')

# Constantes
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
DEFAULT_EXPIRY = 3600  # 1 hora em segundos

# Garante que o diretório de cache exista
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Lock para operações de cache thread-safe
cache_lock = threading.Lock()

def _get_cache_key(cache_type, params):
    """
    Gera uma chave de cache baseada no tipo e parâmetros
    
    Args:
        cache_type (str): Tipo de cache ('ia', 'trends', 'market_analysis', etc)
        params (dict): Parâmetros da requisição
        
    Returns:
        str: Chave MD5 para o arquivo de cache
    """
    # Serializa os parâmetros em ordem alfabética para garantir consistência
    sorted_params = json.dumps(params, sort_keys=True)
    hash_key = hashlib.md5(sorted_params.encode()).hexdigest()
    return f"{cache_type}_{hash_key}"

def get_from_cache(cache_type, params):
    """
    Recupera dados do cache se disponíveis e não expirados
    
    Args:
        cache_type (str): Tipo de cache ('ia', 'trends', 'market_analysis', etc)
        params (dict): Parâmetros da requisição
        
    Returns:
        dict: Dados do cache ou None se não encontrado/expirado
    """
    cache_key = _get_cache_key(cache_type, params)
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    
    if not os.path.exists(cache_file):
        return None
    
    try:
        with cache_lock:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
                
        # Verifica se o cache expirou
        if time.time() > cache_data.get('timestamp', 0) + cache_data.get('expiry', DEFAULT_EXPIRY):
            logger.info(f"Cache expirado para {cache_key}")
            return None
            
        logger.info(f"Cache hit para {cache_key}")
        return cache_data.get('data')
        
    except (json.JSONDecodeError, KeyError, IOError) as e:
        logger.error(f"Erro ao ler cache {cache_file}: {str(e)}")
        return None

def save_to_cache(cache_type, params, data, expiry=DEFAULT_EXPIRY):
    """
    Salva dados no cache
    
    Args:
        cache_type (str): Tipo de cache ('ia', 'trends', 'market_analysis', etc)
        params (dict): Parâmetros da requisição
        data (dict): Dados a serem armazenados
        expiry (int): Tempo de expiração em segundos
        
    Returns:
        bool: True se salvou com sucesso, False caso contrário
    """
    cache_key = _get_cache_key(cache_type, params)
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    
    cache_data = {
        'timestamp': time.time(),
        'expiry': expiry,
        'type': cache_type,
        'params': params,
        'created': time.strftime("%Y-%m-%dT%H:%M:%S.%f"),
        'expires': time.strftime("%Y-%m-%dT%H:%M:%S.%f", 
                                time.localtime(time.time() + expiry)),
        'data': data
    }
    
    try:
        with cache_lock:
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f)
        logger.info(f"Cache salvo para {cache_key}")
        return True
    except IOError as e:
        logger.error(f"Erro ao salvar cache {cache_file}: {str(e)}")
        return False

def clear_expired_cache():
    """
    Remove todos os arquivos de cache expirados
    
    Returns:
        int: Número de arquivos de cache removidos
    """
    removed = 0
    
    try:
        with cache_lock:
            for filename in os.listdir(CACHE_DIR):
                if not filename.endswith('.json'):
                    continue
                    
                cache_file = os.path.join(CACHE_DIR, filename)
                
                try:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                        
                    if time.time() > cache_data.get('timestamp', 0) + cache_data.get('expiry', DEFAULT_EXPIRY):
                        os.remove(cache_file)
                        removed += 1
                        logger.info(f"Removido cache expirado: {filename}")
                        
                except (json.JSONDecodeError, KeyError, IOError) as e:
                    # Arquivo de cache corrompido, remove
                    try:
                        os.remove(cache_file)
                        removed += 1
                        logger.warning(f"Removido cache corrompido: {filename} - {str(e)}")
                    except IOError:
                        pass
        
        logger.info(f"Limpeza de cache concluída: {removed} arquivos removidos")
        return removed
        
    except Exception as e:
        logger.error(f"Erro durante limpeza de cache: {str(e)}")
        return 0

def get_cache_stats():
    """
    Retorna estatísticas sobre o cache
    
    Returns:
        dict: Estatísticas do cache
    """
    stats = {
        'total_files': 0,
        'expired_files': 0,
        'valid_files': 0,
        'types': {},
        'size_bytes': 0
    }
    
    try:
        current_time = time.time()
        
        with cache_lock:
            for filename in os.listdir(CACHE_DIR):
                if not filename.endswith('.json'):
                    continue
                    
                cache_file = os.path.join(CACHE_DIR, filename)
                stats['total_files'] += 1
                stats['size_bytes'] += os.path.getsize(cache_file)
                
                try:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                    
                    cache_type = cache_data.get('type', 'unknown')
                    if cache_type not in stats['types']:
                        stats['types'][cache_type] = 0
                    stats['types'][cache_type] += 1
                    
                    if current_time > cache_data.get('timestamp', 0) + cache_data.get('expiry', DEFAULT_EXPIRY):
                        stats['expired_files'] += 1
                    else:
                        stats['valid_files'] += 1
                        
                except:
                    # Ignora arquivos corrompidos
                    pass
        
        # Converte bytes para KB/MB para melhor legibilidade
        if stats['size_bytes'] > 1024 * 1024:
            stats['size_mb'] = round(stats['size_bytes'] / (1024 * 1024), 2)
        else:
            stats['size_kb'] = round(stats['size_bytes'] / 1024, 2)
            
        return stats
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do cache: {str(e)}")
        return stats
