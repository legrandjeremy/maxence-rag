const oneRace = {
  competitionId: "xxx-xxx",
  id: "xxx-xxxx",
  name: "Etape 2 : Anvers Lille",
  category: 'xxxFromEnum',
  type: 'yyyFromEnum',
  displayOrder: 1,
  status: 'CONFIRMED',
  quotaConfirmed: 2,
  quotaSubstitute: 1,
  eligibilityCriteria: {
      minAge: 13,
      maxAge: 60,
      riderUciIdspecials: [
        395810,
        47868201
      ]
  },
  rankings: [
    {
      rankingId: 'xxx-xxx',
      scalePoints: [
        {
          rankFrom: 1,
          rankTo: 1,
          points: 100
        },
        {
          rankFrom: 2,
          rankTo: 4,
          points: 5
        },
        {
          rankFrom: 5,
          points: 1
        }
      ],
      resultsFromEvents: {}
    },
    {
      rankingId: 'yyy-yyy',
      scalePoints: [
        {
          rankFrom: 1,
          rankTo: 1,
          points: 50
        },
        {
          rankFrom: 2,
          rankTo: 2,
          points: 5
        },
        {
          rankFrom: 3,
          points: 1
        }
      ],
      resultsFromEvents: {}
    }
  ],
  resultsValidatedDateTime: '2025-12-12 12:30:00',
  resultsCommissaireId: 'xlajrjrt',
  results: [
    {
      position: 1,
      riderUciId: 30459
    },
    {
      position: 2,
      riderUciId: 30412
    }
  ]
}

console.log('oneRace', oneRace)
