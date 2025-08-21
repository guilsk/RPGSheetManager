using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Characters {
    public class Character {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        public Guid Id { get; set; }
        [BsonRepresentation(BsonType.String)]
        public Guid SystemId { get; set; }
        [BsonRepresentation(BsonType.String)]
        public Guid UserId { get; set; }
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; }
        public required string Name { get; set; }
        public required List<CharacterData> Data { get; set; }
    }

    public class CharacterData {
        public required string Name { get; set; }
        public string? Value { get; set; }
        public RollConfig? Rollable { get; set; }
        public string? Expression { get; set; }
        public bool Editable { get; set; }
        public bool Edited { get; set; }
        public bool SessionEditable { get; set; }
        public bool Visible { get; set; }
        public string? Category { get; set; }
        public required string Component { get; set; }
        public int? Order { get; set; }
    }

    public class RollConfig {
        public bool Enabled { get; set; }
        public string? Formula { get; set; }
    }
}
