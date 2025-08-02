using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using RPGSheetManager.Domain.Characters;

namespace RPGSheetManager.Domain.Systems {
    public class RPGSystem {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string Description { get; set; }
        [BsonRepresentation(BsonType.String)]
        public Guid OwnerId { get; set; }
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<CharacterData> Template { get; set; } = new List<CharacterData>();
    }
}
