using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Campaigns {
    public class DiceRoll {
        [BsonRepresentation(BsonType.String)]
        public Guid RollerId { get; set; }

        public required string Expression { get; set; } // ex: "2d6+3"

        public int Result { get; set; }

        public List<int>? IndividualRolls { get; set; } // ex: [4, 5]

        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
