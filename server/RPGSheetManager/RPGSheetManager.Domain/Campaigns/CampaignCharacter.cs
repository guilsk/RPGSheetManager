using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Campaigns {
    public class CampaignCharacter {
        [BsonRepresentation(BsonType.String)]
        public Guid CharId { get; set; }

        [BsonRepresentation(BsonType.String)]
        public Guid PlayerId { get; set; }

        public List<DynamicField> DynamicData { get; set; } = new();
    }
}
