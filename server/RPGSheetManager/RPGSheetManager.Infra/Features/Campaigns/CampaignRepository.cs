using MongoDB.Driver;
using RPGSheetManager.Domain.Campaigns;

namespace RPGSheetManager.Infra.Features.Campaigns {
    public class CampaignRepository : ICampaignRepository {
        private readonly IMongoCollection<Campaign> _collection;

        public CampaignRepository(IMongoDatabase database) {
            _collection = database.GetCollection<Campaign>("Campaigns");
        }

        public async Task<List<Campaign>> GetAllAsync() {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task<List<Campaign>> GetByMasterIdAsync(string masterId) {
            return await _collection.Find(c => c.MasterId == masterId).ToListAsync();
        }

        public async Task<List<Campaign>> GetByPlayerIdAsync(string playerId) {
            return await _collection.Find(c => c.PlayerIds.Contains(playerId)).ToListAsync();
        }

        public async Task<Campaign?> GetByIdAsync(string id) {
            return await _collection.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Campaign> AddAsync(Campaign campaign) {
            await _collection.InsertOneAsync(campaign);
            return campaign;
        }

        public async Task UpdateAsync(string id, Campaign campaign) {
            await _collection.ReplaceOneAsync(c => c.Id == id, campaign);
        }

        public async Task DeleteAsync(string id) {
            await _collection.DeleteOneAsync(c => c.Id == id);
        }

        public async Task AddCharacterAsync(string campaignId, CampaignCharacter character) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Push(c => c.Characters, character);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task UpdateCharacterDataAsync(string campaignId, string characterId, List<DynamicField> updatedData) {
            var filter = Builders<Campaign>.Filter.And(
                Builders<Campaign>.Filter.Eq(c => c.Id, campaignId),
                Builders<Campaign>.Filter.ElemMatch(c => c.Characters, ch => ch.CharacterId == characterId)
            );
            var update = Builders<Campaign>.Update.Set("Characters.$.DynamicData", updatedData);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task<bool> UpdateCharacterDataWithValidationAsync(string campaignId, string characterId, string playerId, List<DynamicField> updatedData) {
            // Busca a campanha
            var campaign = await GetByIdAsync(campaignId);
            if (campaign == null) {
                return false; // Campanha não existe
            }

            // Verifica se a sessão está ativa
            if (!campaign.ActiveSession) {
                return false; // Sessão não está ativa
            }

            // Busca o personagem na campanha
            var campaignCharacter = campaign.Characters?.FirstOrDefault(c => c.CharacterId == characterId);
            if (campaignCharacter == null) {
                return false; // Personagem não encontrado na campanha
            }

            // Verifica se o jogador é o dono do personagem
            if (campaignCharacter.PlayerId != playerId) {
                return false; // Jogador não é o dono
            }

            // Atualiza os dados
            var filter = Builders<Campaign>.Filter.And(
                Builders<Campaign>.Filter.Eq(c => c.Id, campaignId),
                Builders<Campaign>.Filter.ElemMatch(c => c.Characters, ch => ch.CharacterId == characterId)
            );
            var update = Builders<Campaign>.Update.Set("Characters.$.DynamicData", updatedData);

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task StartSessionAsync(string campaignId) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Set(c => c.ActiveSession, true);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task EndSessionAsync(string campaignId) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Set(c => c.ActiveSession, false);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task SaveRollHistoryAsync(string campaignId, DiceRoll roll) {
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Push(c => c.DiceHistory, roll);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task<List<Campaign>> GetInvitesByPlayerIdAsync(string playerId) {
            return await _collection.Find(c => c.InvitedPlayerIds.Contains(playerId)).ToListAsync();
        }

        public async Task<bool> AcceptInviteAsync(string campaignId, string playerId) {
            var campaign = await GetByIdAsync(campaignId);
            if (campaign?.InvitedPlayerIds?.Contains(playerId) != true) {
                return false;
            }

            if (campaign.PlayerIds?.Contains(playerId) == true) {
                return false;
            }

            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update
                .Pull(c => c.InvitedPlayerIds, playerId)
                .AddToSet(c => c.PlayerIds, playerId);

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeclineInviteAsync(string campaignId, string playerId) {
            var campaign = await GetByIdAsync(campaignId);
            if (campaign?.InvitedPlayerIds?.Contains(playerId) != true) {
                return false;
            }

            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Pull(c => c.InvitedPlayerIds, playerId);

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> AssociateCharacterAsync(string campaignId, string characterId, string playerId) {
            // Verifica se a campanha existe e se o jogador faz parte dela
            var campaign = await GetByIdAsync(campaignId);
            if (campaign?.PlayerIds?.Contains(playerId) != true) {
                return false; // Jogador não faz parte da campanha
            }

            // Verifica se o personagem já não está associado
            if (campaign.Characters?.Any(c => c.CharacterId == characterId) == true) {
                return false; // Personagem já associado
            }

            // Adiciona o personagem à campanha
            var campaignCharacter = new CampaignCharacter {
                CharacterId = characterId,
                PlayerId = playerId,
                DynamicData = new List<DynamicField>()
            };

            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.Push(c => c.Characters, campaignCharacter);

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> DisassociateCharacterAsync(string campaignId, string characterId, string playerId) {
            // Verifica se a campanha existe e se não está em sessão
            var campaign = await GetByIdAsync(campaignId);
            if (campaign == null || campaign.ActiveSession) {
                return false; // Campanha não existe ou sessão ativa
            }

            // Verifica se o jogador é dono do personagem
            var campaignCharacter = campaign.Characters?.FirstOrDefault(c => c.CharacterId == characterId);
            if (campaignCharacter?.PlayerId != playerId) {
                return false; // Jogador não é dono do personagem
            }

            // Remove o personagem da campanha
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var update = Builders<Campaign>.Update.PullFilter(c => c.Characters,
                Builders<CampaignCharacter>.Filter.Eq(cc => cc.CharacterId, characterId));

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<CampaignCharacter?> GetCampaignCharacterAsync(string campaignId, string characterId) {
            var campaign = await GetByIdAsync(campaignId);
            return campaign?.Characters?.FirstOrDefault(c => c.CharacterId == characterId);
        }
    }
}
