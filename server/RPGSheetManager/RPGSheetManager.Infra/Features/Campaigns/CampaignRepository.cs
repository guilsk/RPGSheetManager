using MongoDB.Driver;
using RPGSheetManager.Domain.Campaigns;
using RPGSheetManager.Domain.Systems;

namespace RPGSheetManager.Infra.Features.Campaigns {
    public class CampaignRepository : ICampaignRepository {
        private readonly IMongoCollection<Campaign> _collection;
        private readonly IMongoCollection<RPGSystem> _systemsCollection;

        public CampaignRepository(IMongoDatabase database) {
            _collection = database.GetCollection<Campaign>("Campaigns");
            _systemsCollection = database.GetCollection<RPGSystem>("Systems");
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

            // Se saiu da campanha de exemplo, re-convida automaticamente
            if (result.ModifiedCount > 0 && campaign.Title == "Campanha de Exemplo") {
                await InviteToExampleCampaignAsync(playerId);
            }

            return result.ModifiedCount > 0;
        }

        public async Task<CampaignCharacter?> GetCampaignCharacterAsync(string campaignId, string characterId) {
            var campaign = await GetByIdAsync(campaignId);
            return campaign?.Characters?.FirstOrDefault(c => c.CharacterId == characterId);
        }

        public async Task<string> InitializeExampleCampaignAsync() {
            // Verifica se já existe campanha de exemplo
            var existingCampaign = await _collection.Find(c => c.Title == "Campanha de Exemplo").FirstOrDefaultAsync();
            if (existingCampaign != null) {
                return existingCampaign.Id!;
            }

            // Busca o sistema Old Quest dinamicamente
            var oldQuestSystem = await _systemsCollection.Find(s => s.Name == "Old Quest").FirstOrDefaultAsync();
            var systemId = oldQuestSystem?.Id ?? "sistema-nao-encontrado";

            var masterId = "google-oauth2|100187283712752596497"; // ID do admin

            // Cria nova campanha de exemplo
            var exampleCampaign = new Campaign {
                Title = "Campanha de Exemplo",
                Description = "Essa campanha é um exemplo para novos usuários.\nEla está sempre ativa e um novo convite será enviado caso saia dela.\nSinta-se à vontade para testar seu personagem aqui.",
                SystemId = systemId,
                MasterId = masterId,
                PlayerIds = new List<string>(),
                InvitedPlayerIds = new List<string>(),
                CreatedAt = DateTime.UtcNow,
                ActiveSession = true,
                Characters = new List<CampaignCharacter>(),
                DiceHistory = new List<DiceRoll>()
            };

            await _collection.InsertOneAsync(exampleCampaign);
            return exampleCampaign.Id!;
        }

        public async Task<bool> InviteToExampleCampaignAsync(string playerId) {
            var exampleCampaign = await _collection.Find(c => c.Title == "Campanha de Exemplo").FirstOrDefaultAsync();
            if (exampleCampaign == null) {
                // Se não existe, cria
                await InitializeExampleCampaignAsync();
                exampleCampaign = await _collection.Find(c => c.Title == "Campanha de Exemplo").FirstOrDefaultAsync();
            }

            if (exampleCampaign == null) return false;

            // Verifica se já está convidado ou já faz parte
            if (exampleCampaign.InvitedPlayerIds?.Contains(playerId) == true ||
                exampleCampaign.PlayerIds?.Contains(playerId) == true) {
                return true; // Já convidado/participando
            }

            // Adiciona convite
            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, exampleCampaign.Id);
            var update = Builders<Campaign>.Update.Push(c => c.InvitedPlayerIds, playerId);
            var result = await _collection.UpdateOneAsync(filter, update);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> RemovePlayerFromCampaignAsync(string campaignId, string playerId) {
            var campaign = await GetByIdAsync(campaignId);
            if (campaign == null) {
                return false;
            }

            // Remove o jogador da lista de jogadores ativos
            var removeFromPlayers = false;
            if (campaign.PlayerIds?.Contains(playerId) == true) {
                removeFromPlayers = true;
            }

            // Remove também dos convidados se ainda estiver lá
            var removeFromInvited = false;
            if (campaign.InvitedPlayerIds?.Contains(playerId) == true) {
                removeFromInvited = true;
            }

            if (!removeFromPlayers && !removeFromInvited) {
                return false; // Jogador não está na campanha
            }

            var filter = Builders<Campaign>.Filter.Eq(c => c.Id, campaignId);
            var updates = new List<UpdateDefinition<Campaign>>();

            if (removeFromPlayers) {
                updates.Add(Builders<Campaign>.Update.Pull(c => c.PlayerIds, playerId));
                // Remove também todos os personagens deste jogador da campanha
                updates.Add(Builders<Campaign>.Update.PullFilter(c => c.Characters,
                    Builders<CampaignCharacter>.Filter.Eq(cc => cc.PlayerId, playerId)));
            }

            if (removeFromInvited) {
                updates.Add(Builders<Campaign>.Update.Pull(c => c.InvitedPlayerIds, playerId));
            }

            var combinedUpdate = Builders<Campaign>.Update.Combine(updates);
            var result = await _collection.UpdateOneAsync(filter, combinedUpdate);

            // Se saiu da campanha de exemplo, re-convida automaticamente
            if (result.ModifiedCount > 0 && campaign.Title == "Campanha de Exemplo") {
                await InviteToExampleCampaignAsync(playerId);
            }

            return result.ModifiedCount > 0;
        }

        public async Task<bool> AddOldQuestSystemToUserAsync(string playerId) {
            // Busca o sistema Old Quest
            var oldQuestSystem = await _systemsCollection.Find(s => s.Name == "Old Quest").FirstOrDefaultAsync();
            if (oldQuestSystem?.Id == null) {
                return false; // Sistema não encontrado
            }

            // Busca o usuário
            var usersCollection = _systemsCollection.Database.GetCollection<Domain.Users.User>("Users");
            var user = await usersCollection.Find(u => u.AuthId == playerId).FirstOrDefaultAsync();
            if (user == null) {
                return false; // Usuário não encontrado
            }

            // Verifica se já tem o sistema salvo
            if (user.SavedSystemIds?.Contains(oldQuestSystem.Id) == true) {
                return true; // Já tem o sistema salvo
            }

            // Adiciona o sistema aos salvos do usuário
            var filter = Builders<Domain.Users.User>.Filter.Eq(u => u.AuthId, playerId);
            var update = Builders<Domain.Users.User>.Update.AddToSet(u => u.SavedSystemIds, oldQuestSystem.Id);
            var result = await usersCollection.UpdateOneAsync(filter, update);

            return result.ModifiedCount > 0;
        }
    }
}
