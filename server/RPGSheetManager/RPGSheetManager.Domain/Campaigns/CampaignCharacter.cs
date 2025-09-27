using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Campaigns {
    public class CampaignCharacter {
        [BsonElement("characterId")]
        public required string CharacterId { get; set; }
        [BsonElement("playerId")]
        public required string PlayerId { get; set; }
        [BsonElement("dynamicData")]
        public List<DynamicField> DynamicData { get; set; } = new();
    }
}
